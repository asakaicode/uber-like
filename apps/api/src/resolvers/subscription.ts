import { UserRole, prisma } from "@uber-like/database";
import type { Resolvers } from "../generated/resolver-types.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getDriverInfo } from "../lib/driver.js";
import { orderInclude } from "../lib/includes.js";
import { PUBSUB_CHANNELS, subscribeChannel } from "../lib/redis.js";

async function* subscribeFiltered(
  channel: string,
  filter: (payload: unknown) => boolean,
): AsyncGenerator<unknown> {
  const queue: unknown[] = [];
  let notify: (() => void) | null = null;

  const unsubscribe = await subscribeChannel(channel, (payload) => {
    if (filter(payload)) {
      queue.push(payload);
      const fn = notify;
      notify = null;
      fn?.();
    }
  });

  try {
    while (true) {
      if (queue.length > 0) {
        yield queue.shift();
      } else {
        await new Promise<void>((res) => {
          notify = res;
        });
      }
    }
  } finally {
    await unsubscribe();
  }
}

export const subscriptionResolvers: Partial<Resolvers> = {
  Subscription: {
    orderStatusChanged: {
      subscribe: (_, { orderId }) =>
        subscribeFiltered(PUBSUB_CHANNELS.ORDER_STATUS_CHANGED, (payload) => {
          const p = payload as { orderId: string };
          return p.orderId === orderId;
        }),
      resolve: (payload: { orderId: string }) =>
        prisma.order.findUniqueOrThrow({ where: { id: payload.orderId }, include: orderInclude }),
    },

    newOrder: {
      subscribe: (_, { restaurantId }) =>
        subscribeFiltered(PUBSUB_CHANNELS.NEW_ORDER, (payload) => {
          const p = payload as { restaurantId: string };
          return p.restaurantId === restaurantId;
        }),
      resolve: (payload: { orderId: string }) =>
        prisma.order.findUniqueOrThrow({ where: { id: payload.orderId }, include: orderInclude }),
    },

    driverOfferReceived: {
      subscribe: (_, __, ctx) => {
        const user = requireAuth(ctx);
        requireRole(user, UserRole.DRIVER);
        return subscribeFiltered(PUBSUB_CHANNELS.DRIVER_OFFER, (payload) => {
          const p = payload as { driverId: string };
          return p.driverId === user.driverId;
        });
      },
      resolve: (payload: { offerId: string }) =>
        prisma.driverOffer.findUniqueOrThrow({
          where: { id: payload.offerId },
          include: {
            delivery: {
              include: {
                order: { include: { restaurant: true, items: { include: { menuItem: true } } } },
              },
            },
            driver: true,
          },
        }),
    },

    driverAssigned: {
      subscribe: (_, { orderId }) =>
        subscribeFiltered(PUBSUB_CHANNELS.DRIVER_ASSIGNED, (payload) => {
          const p = payload as { orderId: string };
          return p.orderId === orderId;
        }),
      resolve: (payload: { orderId: string }) =>
        prisma.order.findUniqueOrThrow({ where: { id: payload.orderId }, include: orderInclude }),
    },

    driverLocationUpdated: {
      subscribe: (_, { deliveryId }) =>
        subscribeFiltered(PUBSUB_CHANNELS.DRIVER_LOCATION, (payload) => {
          const p = payload as { deliveryId: string };
          return p.deliveryId === deliveryId;
        }),
      resolve: async (payload: { deliveryId: string; lat: number; lng: number; heading: number }) => {
        const delivery = await prisma.delivery.findUnique({ where: { id: payload.deliveryId } });
        if (!delivery?.driverId) return null;
        const info = await getDriverInfo(delivery.driverId);
        if (!info) return null;
        return { ...info, lat: payload.lat, lng: payload.lng, heading: payload.heading };
      },
    },
  },
};
