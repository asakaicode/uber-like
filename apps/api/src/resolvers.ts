import bcrypt from "bcryptjs";
import { GraphQLScalarType, Kind } from "graphql";
import {
  DeliveryStatus,
  OfferStatus,
  OrderStatus,
  UserRole,
  prisma,
} from "@uber-like/database";
import { PUBSUB_CHANNELS } from "@uber-like/shared";
import type { JwtPayload } from "./lib/auth.js";
import { requireAuth, requireRole, signToken } from "./lib/auth.js";
import { calculateReward, getMultiLegRoute, getRoute } from "./lib/osrm.js";
import {
  buildConnection,
  clampPageSize,
  encodeCursor,
  orderAfterFilter,
  offerAfterFilter,
} from "./lib/pagination.js";
import { enqueueOrder } from "./lib/queue.js";
import { publishTyped, redisSub } from "./lib/redis.js";

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  serialize(value) {
    if (value instanceof Date) return value.toISOString();
    throw new Error("DateTime must be a Date");
  },
  parseValue(value) {
    return new Date(value as string);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

export interface Context {
  user: JwtPayload | null;
}

const orderInclude = {
  items: { include: { menuItem: true } },
  restaurant: true,
  delivery: { include: { driver: true } },
  rating: true,
} as const;

async function getDriverLocation(driverId: string) {
  return prisma.driverLocation.findFirst({
    where: { driverId },
    orderBy: { createdAt: "desc" },
  });
}

async function mapDriverInfo(driverId: string) {
  const driver = await prisma.driverProfile.findUnique({ where: { id: driverId } });
  if (!driver) return null;
  const loc = await getDriverLocation(driverId);
  return {
    id: driver.id,
    name: driver.name,
    rating: driver.rating,
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    heading: loc?.heading ?? null,
  };
}

async function mapOrder(order: Awaited<ReturnType<typeof prisma.order.findUnique>> & object) {
  const o = order as NonNullable<typeof order> & {
    delivery?: { driverId?: string | null; driver?: { id: string; name: string; rating: number } | null } | null;
  };
  let driverInfo = null;
  if (o.delivery?.driver) {
    const loc = o.delivery.driverId
      ? await getDriverLocation(o.delivery.driverId)
      : null;
    driverInfo = {
      id: o.delivery.driver.id,
      name: o.delivery.driver.name,
      rating: o.delivery.driver.rating,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      heading: loc?.heading ?? null,
    };
  }
  return {
    ...o,
    delivery: o.delivery
      ? { ...o.delivery, driver: driverInfo }
      : null,
  };
}

export const resolvers = {
  DateTime: DateTimeScalar,

  Query: {
    me: (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null;
      return prisma.user.findUnique({
        where: { id: ctx.user.userId },
        select: { id: true, email: true, role: true },
      });
    },

    restaurants: async () => {
      return prisma.restaurant.findMany({
        where: { isOpen: true },
        include: { menuItems: { where: { isAvailable: true } } },
      });
    },

    restaurant: async (_: unknown, { id }: { id: string }) => {
      return prisma.restaurant.findUnique({
        where: { id },
        include: { menuItems: true },
      });
    },

    order: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const user = requireAuth(ctx);
      const order = await prisma.order.findUnique({
        where: { id },
        include: orderInclude,
      });
      if (!order) throw new Error("Order not found");
      if (user.role === UserRole.CUSTOMER && order.customerId !== user.customerId) {
        throw new Error("Forbidden");
      }
      if (user.role === UserRole.RESTAURANT && order.restaurantId !== user.restaurantId) {
        throw new Error("Forbidden");
      }
      return mapOrder(order);
    },

    orders: async (
      _: unknown,
      args: { first?: number; after?: string; status?: OrderStatus },
      ctx: Context,
    ) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.CUSTOMER);
      const size = clampPageSize(args.first);
      const where = {
        customerId: user.customerId!,
        ...(args.status ? { status: args.status } : {}),
        ...orderAfterFilter(args.after),
      };
      const items = await prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: size + 1,
      });
      const conn = buildConnection(items, size);
      const mapped = await Promise.all(conn.edges.map(async (e) => ({
        cursor: e.cursor,
        node: await mapOrder(e.node),
      })));
      return { edges: mapped, pageInfo: conn.pageInfo };
    },

    restaurantOrders: async (
      _: unknown,
      args: { first?: number; after?: string; status?: OrderStatus },
      ctx: Context,
    ) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.RESTAURANT);
      const size = clampPageSize(args.first);
      const where = {
        restaurantId: user.restaurantId!,
        ...(args.status ? { status: args.status } : {}),
        ...orderAfterFilter(args.after),
      };
      const items = await prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: size + 1,
      });
      const conn = buildConnection(items, size);
      const mapped = await Promise.all(conn.edges.map(async (e) => ({
        cursor: e.cursor,
        node: await mapOrder(e.node),
      })));
      return { edges: mapped, pageInfo: conn.pageInfo };
    },

    myOffers: async (
      _: unknown,
      args: { first?: number; after?: string; status?: OfferStatus },
      ctx: Context,
    ) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const size = clampPageSize(args.first);
      const items = await prisma.driverOffer.findMany({
        where: {
          driverId: user.driverId!,
          ...(args.status ? { status: args.status } : {}),
          ...offerAfterFilter(args.after),
        },
        include: {
          delivery: {
            include: {
              order: { include: { restaurant: true, items: { include: { menuItem: true } } } },
            },
          },
          driver: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: size + 1,
      });
      const conn = buildConnection(items, size);
      return {
        edges: conn.edges.map((e) => ({
          cursor: e.cursor,
          node: mapOffer(e.node),
        })),
        pageInfo: conn.pageInfo,
      };
    },

    myActiveDelivery: async (_: unknown, __: unknown, ctx: Context) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const delivery = await prisma.delivery.findFirst({
        where: {
          driverId: user.driverId!,
          status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP] },
        },
        include: {
          order: { include: { restaurant: true } },
          driver: true,
        },
      });
      if (!delivery) return null;
      const driver = await mapDriverInfo(delivery.driverId!);
      return { ...delivery, driver };
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      args: { email: string; password: string; name: string; role: UserRole },
    ) => {
      const existing = await prisma.user.findUnique({ where: { email: args.email } });
      if (existing) throw new Error("Email already registered");
      const passwordHash = await bcrypt.hash(args.password, 10);
      const user = await prisma.user.create({
        data: {
          email: args.email,
          passwordHash,
          role: args.role,
          ...(args.role === UserRole.CUSTOMER
            ? { customerProfile: { create: { name: args.name } } }
            : {}),
          ...(args.role === UserRole.RESTAURANT
            ? {
                restaurant: {
                  create: { name: args.name, lat: 35.6812, lng: 139.7671 },
                },
              }
            : {}),
          ...(args.role === UserRole.DRIVER
            ? { driverProfile: { create: { name: args.name } } }
            : {}),
        },
        include: {
          customerProfile: true,
          restaurant: true,
          driverProfile: true,
        },
      });
      const payload: JwtPayload = {
        userId: user.id,
        role: user.role,
        customerId: user.customerProfile?.id,
        restaurantId: user.restaurant?.id,
        driverId: user.driverProfile?.id,
      };
      return {
        token: signToken(payload),
        user: { id: user.id, email: user.email, role: user.role },
        customerId: user.customerProfile?.id ?? null,
        restaurantId: user.restaurant?.id ?? null,
        driverId: user.driverProfile?.id ?? null,
      };
    },

    login: async (_: unknown, args: { email: string; password: string }) => {
      const user = await prisma.user.findUnique({
        where: { email: args.email },
        include: {
          customerProfile: true,
          restaurant: true,
          driverProfile: true,
        },
      });
      if (!user || !(await bcrypt.compare(args.password, user.passwordHash))) {
        throw new Error("Invalid credentials");
      }
      const payload: JwtPayload = {
        userId: user.id,
        role: user.role,
        customerId: user.customerProfile?.id,
        restaurantId: user.restaurant?.id,
        driverId: user.driverProfile?.id,
      };
      return {
        token: signToken(payload),
        user: { id: user.id, email: user.email, role: user.role },
        customerId: user.customerProfile?.id ?? null,
        restaurantId: user.restaurant?.id ?? null,
        driverId: user.driverProfile?.id ?? null,
      };
    },

    createOrder: async (
      _: unknown,
      { input }: {
        input: {
          restaurantId: string;
          items: Array<{ menuItemId: string; quantity: number }>;
          deliveryAddress: string;
          deliveryLat: number;
          deliveryLng: number;
        };
      },
      ctx: Context,
    ) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.CUSTOMER);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: input.items.map((i) => i.menuItemId) },
          restaurantId: input.restaurantId,
          isAvailable: true,
        },
      });
      if (menuItems.length !== input.items.length) {
        throw new Error("Invalid menu items");
      }
      const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
      let totalAmount = 0;
      const orderItems = input.items.map((item) => {
        const unitPrice = priceMap.get(item.menuItemId)!;
        totalAmount += unitPrice * item.quantity;
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice,
        };
      });
      const order = await prisma.order.create({
        data: {
          customerId: user.customerId!,
          restaurantId: input.restaurantId,
          totalAmount,
          deliveryAddress: input.deliveryAddress,
          deliveryLat: input.deliveryLat,
          deliveryLng: input.deliveryLng,
          status: OrderStatus.PENDING_RESTAURANT,
          items: { create: orderItems },
          delivery: { create: {} },
        },
        include: orderInclude,
      });
      await publishTyped({
        type: PUBSUB_CHANNELS.NEW_ORDER,
        orderId: order.id,
        restaurantId: order.restaurantId,
      });
      return mapOrder(order);
    },

    acceptOrder: async (_: unknown, { orderId }: { orderId: string }, ctx: Context) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.RESTAURANT);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.restaurantId !== user.restaurantId) {
        throw new Error("Order not found");
      }
      if (order.status !== OrderStatus.PENDING_RESTAURANT) {
        throw new Error("Order cannot be accepted");
      }
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.QUEUED },
        include: orderInclude,
      });
      await enqueueOrder(orderId);
      await publishTyped({
        type: PUBSUB_CHANNELS.ORDER_STATUS_CHANGED,
        orderId,
        status: OrderStatus.QUEUED,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
      });
      return mapOrder(updated);
    },

    rejectOrder: async (_: unknown, { orderId }: { orderId: string }, ctx: Context) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.RESTAURANT);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.restaurantId !== user.restaurantId) {
        throw new Error("Order not found");
      }
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.RESTAURANT_REJECTED },
        include: orderInclude,
      });
      await publishTyped({
        type: PUBSUB_CHANNELS.ORDER_STATUS_CHANGED,
        orderId,
        status: OrderStatus.RESTAURANT_REJECTED,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
      });
      return mapOrder(updated);
    },

    setDriverOnline: async (_: unknown, { isOnline }: { isOnline: boolean }, ctx: Context) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const driver = await prisma.driverProfile.update({
        where: { id: user.driverId! },
        data: { isOnline },
      });
      return mapDriverInfo(driver.id);
    },

    updateDriverLocation: async (
      _: unknown,
      args: { lat: number; lng: number; heading?: number },
      ctx: Context,
    ) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      await prisma.driverLocation.create({
        data: {
          driverId: user.driverId!,
          lat: args.lat,
          lng: args.lng,
          heading: args.heading ?? 0,
        },
      });
      const activeDelivery = await prisma.delivery.findFirst({
        where: {
          driverId: user.driverId!,
          status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP] },
        },
      });
      if (activeDelivery) {
        await publishTyped({
          type: PUBSUB_CHANNELS.DRIVER_LOCATION,
          deliveryId: activeDelivery.id,
          lat: args.lat,
          lng: args.lng,
          heading: args.heading ?? 0,
        });
      }
      return mapDriverInfo(user.driverId!);
    },

    respondToOffer: async (
      _: unknown,
      { offerId, accept }: { offerId: string; accept: boolean },
      ctx: Context,
    ) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const offer = await prisma.driverOffer.findUnique({
        where: { id: offerId },
        include: {
          delivery: { include: { order: true } },
        },
      });
      if (!offer || offer.driverId !== user.driverId) {
        throw new Error("Offer not found");
      }
      if (offer.status !== OfferStatus.PENDING) {
        throw new Error("Offer already responded");
      }
      if (new Date() > offer.expiresAt) {
        await prisma.driverOffer.update({
          where: { id: offerId },
          data: { status: OfferStatus.EXPIRED },
        });
        throw new Error("Offer expired");
      }

      if (!accept) {
        const updated = await prisma.driverOffer.update({
          where: { id: offerId },
          data: { status: OfferStatus.REJECTED },
          include: {
            delivery: {
              include: { order: { include: { restaurant: true, items: { include: { menuItem: true } } } } },
            },
            driver: true,
          },
        });
        return mapOffer(updated);
      }

      const order = offer.delivery.order;
      const updatedOffer = await prisma.$transaction(async (tx) => {
        await tx.driverOffer.update({
          where: { id: offerId },
          data: { status: OfferStatus.ACCEPTED },
        });
        await tx.driverOffer.updateMany({
          where: {
            deliveryId: offer.deliveryId,
            id: { not: offerId },
            status: OfferStatus.PENDING,
          },
          data: { status: OfferStatus.EXPIRED },
        });
        await tx.delivery.update({
          where: { id: offer.deliveryId },
          data: {
            driverId: user.driverId!,
            status: DeliveryStatus.ASSIGNED,
          },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.DRIVER_ASSIGNED },
        });
        return tx.driverOffer.findUnique({
          where: { id: offerId },
          include: {
            delivery: {
              include: { order: { include: { restaurant: true, items: { include: { menuItem: true } } } } },
            },
            driver: true,
          },
        });
      });

      await publishTyped({
        type: PUBSUB_CHANNELS.DRIVER_ASSIGNED,
        orderId: order.id,
        driverId: user.driverId!,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
      });
      await publishTyped({
        type: PUBSUB_CHANNELS.ORDER_STATUS_CHANGED,
        orderId: order.id,
        status: OrderStatus.DRIVER_ASSIGNED,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
      });
      return mapOffer(updatedOffer!);
    },

    confirmPickup: async (_: unknown, { deliveryId }: { deliveryId: string }, ctx: Context) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true, driver: true },
      });
      if (!delivery || delivery.driverId !== user.driverId) {
        throw new Error("Delivery not found");
      }
      const updated = await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: deliveryId },
          data: { status: DeliveryStatus.PICKED_UP },
        });
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: OrderStatus.PICKED_UP },
        });
        return tx.delivery.findUnique({
          where: { id: deliveryId },
          include: { order: true, driver: true },
        });
      });
      await publishTyped({
        type: PUBSUB_CHANNELS.ORDER_STATUS_CHANGED,
        orderId: delivery.orderId,
        status: OrderStatus.PICKED_UP,
        customerId: delivery.order.customerId,
        restaurantId: delivery.order.restaurantId,
      });
      const driver = await mapDriverInfo(user.driverId!);
      return { ...updated!, driver };
    },

    confirmDelivery: async (_: unknown, { deliveryId }: { deliveryId: string }, ctx: Context) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true, driver: true },
      });
      if (!delivery || delivery.driverId !== user.driverId) {
        throw new Error("Delivery not found");
      }
      const updated = await prisma.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: deliveryId },
          data: { status: DeliveryStatus.DELIVERED },
        });
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: OrderStatus.DELIVERED },
        });
        return tx.delivery.findUnique({
          where: { id: deliveryId },
          include: { order: true, driver: true },
        });
      });
      await publishTyped({
        type: PUBSUB_CHANNELS.ORDER_STATUS_CHANGED,
        orderId: delivery.orderId,
        status: OrderStatus.DELIVERED,
        customerId: delivery.order.customerId,
        restaurantId: delivery.order.restaurantId,
      });
      const driver = await mapDriverInfo(user.driverId!);
      return { ...updated!, driver };
    },

    rateDriver: async (
      _: unknown,
      args: { orderId: string; score: number; comment?: string },
      ctx: Context,
    ) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.CUSTOMER);
      if (args.score < 1 || args.score > 5) throw new Error("Score must be 1-5");
      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: { delivery: true, rating: true },
      });
      if (!order || order.customerId !== user.customerId) {
        throw new Error("Order not found");
      }
      if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED) {
        throw new Error("Order not yet delivered");
      }
      if (order.rating) throw new Error("Already rated");
      const rating = await prisma.$transaction(async (tx) => {
        const r = await tx.rating.create({
          data: {
            orderId: args.orderId,
            score: args.score,
            comment: args.comment,
          },
        });
        await tx.order.update({
          where: { id: args.orderId },
          data: { status: OrderStatus.COMPLETED },
        });
        if (order.delivery?.driverId) {
          const ratings = await tx.rating.findMany({
            where: { order: { delivery: { driverId: order.delivery.driverId } } },
          });
          const avg = ratings.reduce((s, r) => s + r.score, args.score) / (ratings.length + 1);
          await tx.driverProfile.update({
            where: { id: order.delivery.driverId },
            data: { rating: avg },
          });
        }
        return r;
      });
      return rating;
    },
  },

  Subscription: {
    orderStatusChanged: {
      subscribe: (_: unknown, { orderId }: { orderId: string }) =>
        subscribeFiltered(PUBSUB_CHANNELS.ORDER_STATUS_CHANGED, (payload) => {
          const p = payload as { orderId: string };
          return p.orderId === orderId;
        }),
      resolve: async (payload: { orderId: string }) => {
        const order = await prisma.order.findUnique({
          where: { id: payload.orderId },
          include: orderInclude,
        });
        return mapOrder(order!);
      },
    },
    newOrder: {
      subscribe: (_: unknown, { restaurantId }: { restaurantId: string }) =>
        subscribeFiltered(PUBSUB_CHANNELS.NEW_ORDER, (payload) => {
          const p = payload as { restaurantId: string };
          return p.restaurantId === restaurantId;
        }),
      resolve: async (payload: { orderId: string }) => {
        const order = await prisma.order.findUnique({
          where: { id: payload.orderId },
          include: orderInclude,
        });
        return mapOrder(order!);
      },
    },
    driverOfferReceived: {
      subscribe: (_: unknown, __: unknown, ctx: Context) => {
        const user = requireAuth(ctx);
        requireRole(user, UserRole.DRIVER);
        return subscribeFiltered(PUBSUB_CHANNELS.DRIVER_OFFER, (payload) => {
          const p = payload as { driverId: string };
          return p.driverId === user.driverId;
        });
      },
      resolve: async (payload: { offerId: string }) => {
        const offer = await prisma.driverOffer.findUnique({
          where: { id: payload.offerId },
          include: {
            delivery: {
              include: { order: { include: { restaurant: true, items: { include: { menuItem: true } } } } },
            },
            driver: true,
          },
        });
        return mapOffer(offer!);
      },
    },
    driverAssigned: {
      subscribe: (_: unknown, { orderId }: { orderId: string }) =>
        subscribeFiltered(PUBSUB_CHANNELS.DRIVER_ASSIGNED, (payload) => {
          const p = payload as { orderId: string };
          return p.orderId === orderId;
        }),
      resolve: async (payload: { orderId: string }) => {
        const order = await prisma.order.findUnique({
          where: { id: payload.orderId },
          include: orderInclude,
        });
        return mapOrder(order!);
      },
    },
    driverLocationUpdated: {
      subscribe: (_: unknown, { deliveryId }: { deliveryId: string }) =>
        subscribeFiltered(PUBSUB_CHANNELS.DRIVER_LOCATION, (payload) => {
          const p = payload as { deliveryId: string };
          return p.deliveryId === deliveryId;
        }),
      resolve: async (payload: { deliveryId: string; lat: number; lng: number; heading: number }) => {
        const delivery = await prisma.delivery.findUnique({ where: { id: payload.deliveryId } });
        if (!delivery?.driverId) return null;
        return {
          ...(await mapDriverInfo(delivery.driverId)),
          lat: payload.lat,
          lng: payload.lng,
          heading: payload.heading,
        };
      },
    },
  },

  DriverOffer: {
    order: (parent: { delivery: { order: unknown } }) => parent.delivery.order,
    distanceToRestaurant: (parent: { delivery: { distanceToRestaurant: number | null } }) =>
      parent.delivery.distanceToRestaurant,
    distanceToCustomer: (parent: { delivery: { distanceToCustomer: number | null } }) =>
      parent.delivery.distanceToCustomer,
    totalDistance: (parent: { delivery: { totalDistance: number | null } }) =>
      parent.delivery.totalDistance,
    estimatedMinutes: (parent: { delivery: { estimatedMinutes: number | null } }) =>
      parent.delivery.estimatedMinutes,
    reward: (parent: { delivery: { reward: number | null } }) => parent.delivery.reward,
    routeGeometry: () => null,
  },
};

function mapOffer(offer: {
  id: string;
  status: OfferStatus;
  priority: number;
  expiresAt: Date;
  createdAt: Date;
  delivery: unknown;
  driver?: unknown;
}) {
  return offer;
}

async function* subscribeFiltered(
  channel: string,
  filter: (payload: unknown) => boolean,
) {
  const subscriber = redisSub.duplicate();
  const messageQueue: unknown[] = [];
  let resolve: ((value: IteratorResult<unknown>) => void) | null = null;

  subscriber.on("message", (_ch, message) => {
    try {
      const payload = JSON.parse(message);
      if (filter(payload)) {
        if (resolve) {
          resolve({ value: payload, done: false });
          resolve = null;
        } else {
          messageQueue.push(payload);
        }
      }
    } catch {
      // ignore
    }
  });

  await subscriber.subscribe(channel);

  try {
    while (true) {
      if (messageQueue.length > 0) {
        yield messageQueue.shift();
      } else {
        yield await new Promise<unknown>((res) => {
          resolve = (result) => res(result.value);
        });
      }
    }
  } finally {
    await subscriber.unsubscribe(channel);
    subscriber.disconnect();
  }
}

export { getRoute, getMultiLegRoute, calculateReward, mapDriverInfo };
