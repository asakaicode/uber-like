import { Worker } from "bullmq";
import Redis from "ioredis";
import {
  DeliveryStatus,
  OfferStatus,
  OrderStatus,
  prisma,
} from "@uber-like/database";
import { PUBSUB_CHANNELS } from "@uber-like/shared";
import { calculateReward, getOfferExpiry, getRoute, scoreDriver } from "./osrm.js";
import { ORTOOLS_THRESHOLD } from "./config.js";
import { matchWithOrtools } from "./ortools.js";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
const DISPATCH_QUEUE = "dispatch-orders";

async function getDriverLocation(driverId: string) {
  return prisma.driverLocation.findFirst({
    where: { driverId },
    orderBy: { createdAt: "desc" },
  });
}

interface OfferRouteData {
  distToRestaurant: number;
  distToCustomer: number;
  totalDist: number;
  duration: number;
  reward: number;
  score: number;
}

async function createOfferForDriver(
  orderId: string,
  delivery: { id: string },
  driverId: string,
  routeData: OfferRouteData,
): Promise<void> {
  const offer = await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.OFFERED } });
    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        distanceToRestaurant: routeData.distToRestaurant,
        distanceToCustomer: routeData.distToCustomer,
        totalDistance: routeData.totalDist,
        estimatedMinutes: Math.ceil(routeData.duration / 60),
        reward: routeData.reward,
      },
    });
    return tx.driverOffer.create({
      data: {
        deliveryId: delivery.id,
        driverId,
        status: OfferStatus.PENDING,
        priority: routeData.score,
        expiresAt: getOfferExpiry(),
      },
    });
  });

  await redis.publish(
    PUBSUB_CHANNELS.DRIVER_OFFER,
    JSON.stringify({ offerId: offer.id, driverId }),
  );

  console.log(`Offer ${offer.id} sent to driver ${driverId} for order ${orderId}`);
}

async function dispatchOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: true,
      delivery: { include: { offers: true } },
    },
  });

  if (!order || (order.status !== OrderStatus.QUEUED && order.status !== OrderStatus.OFFERED)) {
    return;
  }

  const delivery = order.delivery;
  if (!delivery) return;

  const pendingOffer = await prisma.driverOffer.findFirst({
    where: { deliveryId: delivery.id, status: OfferStatus.PENDING },
  });
  if (pendingOffer) {
    if (new Date() > pendingOffer.expiresAt) {
      await prisma.driverOffer.update({
        where: { id: pendingOffer.id },
        data: { status: OfferStatus.EXPIRED },
      });
    } else {
      return;
    }
  }

  const acceptedOffer = delivery.offers.find((o) => o.status === OfferStatus.ACCEPTED);
  if (acceptedOffer) return;

  const drivers = await prisma.driverProfile.findMany({ where: { isOnline: true } });

  const rejectedDriverIds = new Set(
    delivery.offers
      .filter((o) => o.status === OfferStatus.REJECTED || o.status === OfferStatus.EXPIRED)
      .map((o) => o.driverId),
  );

  const candidates: Array<{ driverId: string } & OfferRouteData> = [];

  for (const driver of drivers) {
    if (rejectedDriverIds.has(driver.id)) continue;

    const hasActive = await prisma.delivery.findFirst({
      where: {
        driverId: driver.id,
        status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP] },
      },
    });
    if (hasActive) continue;

    const loc = await getDriverLocation(driver.id);
    if (!loc) continue;

    try {
      const toRestaurant = await getRoute(
        { lat: loc.lat, lng: loc.lng },
        { lat: order.restaurant.lat, lng: order.restaurant.lng },
      );
      const toCustomer = await getRoute(
        { lat: order.restaurant.lat, lng: order.restaurant.lng },
        { lat: order.deliveryLat, lng: order.deliveryLng },
      );
      const totalDist = toRestaurant.distanceMeters + toCustomer.distanceMeters;
      candidates.push({
        driverId: driver.id,
        score: scoreDriver(toRestaurant.distanceMeters, toCustomer.distanceMeters, driver.rating),
        distToRestaurant: toRestaurant.distanceMeters,
        distToCustomer: toCustomer.distanceMeters,
        totalDist,
        duration: toRestaurant.durationSeconds + toCustomer.durationSeconds,
        reward: calculateReward(totalDist / 1000),
      });
    } catch {
      continue;
    }
  }

  if (candidates.length === 0) {
    setTimeout(() => { dispatchOrder(orderId).catch(console.error); }, 30000);
    return;
  }

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0]!;
  await createOfferForDriver(orderId, delivery, best.driverId, best);
}

const worker = new Worker(
  DISPATCH_QUEUE,
  async (job) => { await dispatchOrder(job.data.orderId as string); },
  {
    connection: redis as unknown as import("bullmq").ConnectionOptions,
    concurrency: 5,
  },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

async function pollQueuedOrders() {
  const orders = await prisma.order.findMany({
    where: { status: { in: [OrderStatus.QUEUED, OrderStatus.OFFERED] } },
    include: { restaurant: true, delivery: { include: { offers: true } } },
  });

  const unassigned = orders.filter((o) => {
    const hasPending = o.delivery?.offers.some((of) => of.status === OfferStatus.PENDING);
    const hasAccepted = o.delivery?.offers.some((of) => of.status === OfferStatus.ACCEPTED);
    return !hasPending && !hasAccepted;
  });

  if (unassigned.length >= ORTOOLS_THRESHOLD) {
    await batchDispatchWithOrtools(unassigned).catch(console.error);
    return; // OR-Tools handles all unassigned orders this cycle
  }

  for (const order of orders) {
    await dispatchOrder(order.id).catch(console.error);
  }
}

async function batchDispatchWithOrtools(
  orders: Array<{
    id: string;
    restaurant: { lat: number; lng: number };
    deliveryLat: number;
    deliveryLng: number;
    delivery: { id: string; offers: Array<{ driverId: string; status: OfferStatus }> } | null;
  }>,
) {
  const drivers = await prisma.driverProfile.findMany({ where: { isOnline: true } });
  if (drivers.length === 0 || orders.length === 0) return;

  // Build cost matrix and cache route data for later offer creation
  const costMatrix: number[][] = [];
  const routeCache = new Map<string, Map<string, OfferRouteData>>();

  for (const order of orders) {
    const row: number[] = [];
    const orderRoutes = new Map<string, OfferRouteData>();

    for (const driver of drivers) {
      const rejectedDriverIds = new Set(
        order.delivery?.offers
          .filter((o) => o.status === OfferStatus.REJECTED || o.status === OfferStatus.EXPIRED)
          .map((o) => o.driverId) ?? [],
      );
      if (rejectedDriverIds.has(driver.id)) {
        row.push(1e9);
        continue;
      }

      const loc = await getDriverLocation(driver.id);
      if (!loc) {
        row.push(1e9);
        continue;
      }
      try {
        const toRestaurant = await getRoute(
          { lat: loc.lat, lng: loc.lng },
          { lat: order.restaurant.lat, lng: order.restaurant.lng },
        );
        const toCustomer = await getRoute(
          { lat: order.restaurant.lat, lng: order.restaurant.lng },
          { lat: order.deliveryLat, lng: order.deliveryLng },
        );
        const totalDist = toRestaurant.distanceMeters + toCustomer.distanceMeters;
        const data: OfferRouteData = {
          distToRestaurant: toRestaurant.distanceMeters,
          distToCustomer: toCustomer.distanceMeters,
          totalDist,
          duration: toRestaurant.durationSeconds + toCustomer.durationSeconds,
          reward: calculateReward(totalDist / 1000),
          score: scoreDriver(toRestaurant.distanceMeters, toCustomer.distanceMeters, driver.rating),
        };
        row.push(toRestaurant.distanceMeters);
        orderRoutes.set(driver.id, data);
      } catch {
        row.push(1e9);
      }
    }
    costMatrix.push(row);
    routeCache.set(order.id, orderRoutes);
  }

  const assignments = await matchWithOrtools({
    orderIds: orders.map((o) => o.id),
    driverIds: drivers.map((d) => d.id),
    costMatrix,
  });

  for (const [orderId, driverId] of assignments) {
    if (!driverId) continue;
    const order = orders.find((o) => o.id === orderId);
    const routeData = routeCache.get(orderId)?.get(driverId);
    if (!order?.delivery || !routeData) continue;

    await createOfferForDriver(orderId, order.delivery, driverId, routeData).catch(console.error);
  }
}

const interval = Number(process.env.DISPATCH_INTERVAL_MS ?? 5000);
setInterval(() => { pollQueuedOrders().catch(console.error); }, interval);

console.log(`Dispatcher worker started (poll every ${interval}ms)`);

process.on("SIGINT", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
