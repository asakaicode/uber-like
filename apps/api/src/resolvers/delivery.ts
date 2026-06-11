import { GraphQLError } from "graphql";
import { DeliveryStatus, OfferStatus, OrderStatus, UserRole, prisma } from "@uber-like/database";
import type { Resolvers } from "../generated/resolver-types.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getDriverLocation, requireDriverInfo } from "../lib/driver.js";
import { offerInclude } from "../lib/includes.js";
import { assertDeliveryTransition, assertOrderTransition } from "../lib/orderState.js";
import { clampPageSize, offerAfterFilter, buildConnection } from "../lib/pagination.js";
import { PUBSUB_CHANNELS, publishTyped } from "../lib/redis.js";

export const deliveryResolvers: Partial<Resolvers> = {
  Query: {
    myOffers: async (_, args, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const size = clampPageSize(args.first);
      const items = await prisma.driverOffer.findMany({
        where: {
          driverId: user.driverId!,
          ...(args.status ? { status: args.status } : {}),
          ...offerAfterFilter(args.after),
        },
        include: offerInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: size + 1,
      });
      return buildConnection(items, size);
    },

    myActiveDelivery: async (_, __, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      return prisma.delivery.findFirst({
        where: {
          driverId: user.driverId!,
          status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP] },
        },
        include: {
          order: { include: { restaurant: true } },
          driver: { include: { locations: { orderBy: { createdAt: "desc" }, take: 1 } } },
        },
      });
    },
  },

  Mutation: {
    setDriverOnline: async (_, { isOnline }, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const driver = await prisma.driverProfile.update({
        where: { id: user.driverId! },
        data: { isOnline },
      });
      return requireDriverInfo(driver.id);
    },

    updateDriverLocation: async (_, args, ctx) => {
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
      return requireDriverInfo(user.driverId!);
    },

    respondToOffer: async (_, { offerId, accept }, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const offer = await prisma.driverOffer.findUnique({
        where: { id: offerId },
        include: { delivery: { include: { order: true } } },
      });
      if (!offer || offer.driverId !== user.driverId) {
        throw new GraphQLError("Offer not found", { extensions: { code: "NOT_FOUND" } });
      }
      if (offer.status !== OfferStatus.PENDING) {
        throw new GraphQLError("Offer already responded", {
          extensions: { code: "OFFER_ALREADY_RESPONDED" },
        });
      }
      if (new Date() > offer.expiresAt) {
        await prisma.driverOffer.update({
          where: { id: offerId },
          data: { status: OfferStatus.EXPIRED },
        });
        throw new GraphQLError("Offer expired", { extensions: { code: "OFFER_EXPIRED" } });
      }

      if (!accept) {
        return prisma.driverOffer.update({
          where: { id: offerId },
          data: { status: OfferStatus.REJECTED },
          include: offerInclude,
        });
      }

      const order = offer.delivery.order;
      assertOrderTransition(order.status, OrderStatus.DRIVER_ASSIGNED);

      const updatedOffer = await prisma.$transaction(async (tx) => {
        await tx.driverOffer.update({ where: { id: offerId }, data: { status: OfferStatus.ACCEPTED } });
        await tx.driverOffer.updateMany({
          where: { deliveryId: offer.deliveryId, id: { not: offerId }, status: OfferStatus.PENDING },
          data: { status: OfferStatus.EXPIRED },
        });
        await tx.delivery.update({
          where: { id: offer.deliveryId },
          data: { driverId: user.driverId!, status: DeliveryStatus.ASSIGNED },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.DRIVER_ASSIGNED },
        });
        return tx.driverOffer.findUniqueOrThrow({ where: { id: offerId }, include: offerInclude });
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
      return updatedOffer;
    },

    confirmPickup: async (_, { deliveryId }, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true, driver: true },
      });
      if (!delivery || delivery.driverId !== user.driverId) {
        throw new GraphQLError("Delivery not found", { extensions: { code: "NOT_FOUND" } });
      }
      assertDeliveryTransition(delivery.status, DeliveryStatus.PICKED_UP);
      const updated = await prisma.$transaction(async (tx) => {
        await tx.delivery.update({ where: { id: deliveryId }, data: { status: DeliveryStatus.PICKED_UP } });
        await tx.order.update({ where: { id: delivery.orderId }, data: { status: OrderStatus.PICKED_UP } });
        return tx.delivery.findUniqueOrThrow({
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
      return updated;
    },

    confirmDelivery: async (_, { deliveryId }, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.DRIVER);
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true, driver: true },
      });
      if (!delivery || delivery.driverId !== user.driverId) {
        throw new GraphQLError("Delivery not found", { extensions: { code: "NOT_FOUND" } });
      }
      assertDeliveryTransition(delivery.status, DeliveryStatus.DELIVERED);
      const updated = await prisma.$transaction(async (tx) => {
        await tx.delivery.update({ where: { id: deliveryId }, data: { status: DeliveryStatus.DELIVERED } });
        await tx.order.update({ where: { id: delivery.orderId }, data: { status: OrderStatus.DELIVERED } });
        return tx.delivery.findUniqueOrThrow({
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
      return updated;
    },
  },

  Delivery: {
    driver: async (parent) => {
      if (!parent.driverId) return null;
      const profile =
        parent.driver ??
        (await prisma.driverProfile.findUnique({
          where: { id: parent.driverId },
          include: { locations: { orderBy: { createdAt: "desc" }, take: 1 } },
        }));
      if (!profile) return null;
      const loc = profile.locations?.[0] ?? (await getDriverLocation(parent.driverId));
      return {
        id: profile.id,
        name: profile.name,
        rating: profile.rating,
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        heading: loc?.heading ?? null,
      };
    },
    order: (parent) =>
      parent.order ?? prisma.order.findUniqueOrThrow({ where: { id: parent.orderId } }),
  },

  DriverOffer: {
    order: (parent) => parent.delivery.order,
    distanceToRestaurant: (parent) => parent.delivery.distanceToRestaurant,
    distanceToCustomer: (parent) => parent.delivery.distanceToCustomer,
    totalDistance: (parent) => parent.delivery.totalDistance,
    estimatedMinutes: (parent) => parent.delivery.estimatedMinutes,
    reward: (parent) => parent.delivery.reward,
    routeGeometry: () => null,
  },
};
