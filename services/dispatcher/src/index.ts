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

async function dispatchOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: true,
      delivery: { include: { offers: true } },
    },
  });

  if (!order || order.status !== OrderStatus.QUEUED && order.status !== OrderStatus.OFFERED) {
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

  const drivers = await prisma.driverProfile.findMany({
    where: { isOnline: true },
  });

  const rejectedDriverIds = new Set(
    delivery.offers
      .filter((o) => o.status === OfferStatus.REJECTED || o.status === OfferStatus.EXPIRED)
      .map((o) => o.driverId),
  );

  const acceptedOffer = delivery.offers.find((o) => o.status === OfferStatus.ACCEPTED);
  if (acceptedOffer) return;

  const candidates: Array<{
    driverId: string;
    score: number;
    distToRestaurant: number;
    distToCustomer: number;
    totalDist: number;
    duration: number;
    reward: number;
  }> = [];

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
      const totalKm = totalDist / 1000;
      candidates.push({
        driverId: driver.id,
        score: scoreDriver(
          toRestaurant.distanceMeters,
          toCustomer.distanceMeters,
          driver.rating,
        ),
        distToRestaurant: toRestaurant.distanceMeters,
        distToCustomer: toCustomer.distanceMeters,
        totalDist,
        duration: toRestaurant.durationSeconds + toCustomer.durationSeconds,
        reward: calculateReward(totalKm),
      });
    } catch {
      continue;
    }
  }

  if (candidates.length === 0) {
    setTimeout(() => {
      dispatchOrder(orderId).catch(console.error);
    }, 30000);
    return;
  }

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0]!;

  const offer = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.OFFERED },
    });
    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        distanceToRestaurant: best.distToRestaurant,
        distanceToCustomer: best.distToCustomer,
        totalDistance: best.totalDist,
        estimatedMinutes: Math.ceil(best.duration / 60),
        reward: best.reward,
      },
    });
    return tx.driverOffer.create({
      data: {
        deliveryId: delivery.id,
        driverId: best.driverId,
        status: OfferStatus.PENDING,
        priority: best.score,
        expiresAt: getOfferExpiry(),
      },
    });
  });

  await redis.publish(
    PUBSUB_CHANNELS.DRIVER_OFFER,
    JSON.stringify({ offerId: offer.id, driverId: best.driverId }),
  );

  console.log(`Offer ${offer.id} sent to driver ${best.driverId} for order ${orderId}`);
}

const worker = new Worker(
  DISPATCH_QUEUE,
  async (job) => {
    await dispatchOrder(job.data.orderId as string);
  },
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
  }

  for (const order of orders) {
    await dispatchOrder(order.id).catch(console.error);
  }
}

async function batchDispatchWithOrtools(
  orders: Array<{ id: string; restaurant: { lat: number; lng: number }; deliveryLat: number; deliveryLng: number }>,
) {
  const drivers = await prisma.driverProfile.findMany({ where: { isOnline: true } });
  if (drivers.length === 0 || orders.length === 0) return;

  const costMatrix: number[][] = [];
  for (const order of orders) {
    const row: number[] = [];
    for (const driver of drivers) {
      const loc = await getDriverLocation(driver.id);
      if (!loc) {
        row.push(1e9);
        continue;
      }
      try {
        const route = await getRoute(
          { lat: loc.lat, lng: loc.lng },
          { lat: order.restaurant.lat, lng: order.restaurant.lng },
        );
        row.push(route.distanceMeters);
      } catch {
        row.push(1e9);
      }
    }
    costMatrix.push(row);
  }

  const assignments = await matchWithOrtools({
    orderIds: orders.map((o) => o.id),
    driverIds: drivers.map((d) => d.id),
    costMatrix,
  });

  for (const order of orders) {
    const driverId = assignments.get(order.id);
    if (driverId) {
      console.log(`OR-Tools assigned order ${order.id} to driver ${driverId}`);
    }
  }
}

const interval = Number(process.env.DISPATCH_INTERVAL_MS ?? 5000);
setInterval(() => {
  pollQueuedOrders().catch(console.error);
}, interval);

console.log(`Dispatcher worker started (poll every ${interval}ms)`);

process.on("SIGINT", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
