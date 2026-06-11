import { GraphQLError } from "graphql";
import { type Prisma, OrderStatus, UserRole, prisma } from "@uber-like/database";
import type { Resolvers } from "../generated/resolver-types.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { orderInclude } from "../lib/includes.js";
import { assertOrderTransition } from "../lib/orderState.js";
import { buildConnection, clampPageSize, orderAfterFilter } from "../lib/pagination.js";
import { enqueueOrder } from "../lib/queue.js";
import { PUBSUB_CHANNELS, publishTyped } from "../lib/redis.js";

async function paginateOrders(
  where: Prisma.OrderWhereInput,
  args: { first?: number | null; after?: string | null; status?: OrderStatus | null },
) {
  const size = clampPageSize(args.first);
  const items = await prisma.order.findMany({
    where: {
      ...where,
      ...(args.status ? { status: args.status } : {}),
      ...orderAfterFilter(args.after),
    },
    include: orderInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: size + 1,
  });
  return buildConnection(items, size);
}

export const orderResolvers: Partial<Resolvers> = {
  Query: {
    restaurants: () =>
      prisma.restaurant.findMany({
        where: { isOpen: true },
        include: { menuItems: { where: { isAvailable: true } } },
      }),

    restaurant: (_, { id }) =>
      prisma.restaurant.findUnique({ where: { id }, include: { menuItems: true } }),

    order: async (_, { id }, ctx) => {
      const user = requireAuth(ctx);
      const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
      if (!order) throw new GraphQLError("Order not found", { extensions: { code: "NOT_FOUND" } });
      if (user.role === UserRole.CUSTOMER && order.customerId !== user.customerId) {
        throw new GraphQLError("Forbidden", { extensions: { code: "FORBIDDEN" } });
      }
      if (user.role === UserRole.RESTAURANT && order.restaurantId !== user.restaurantId) {
        throw new GraphQLError("Forbidden", { extensions: { code: "FORBIDDEN" } });
      }
      return order;
    },

    orders: async (_, args, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.CUSTOMER);
      return paginateOrders({ customerId: user.customerId! }, args);
    },

    restaurantOrders: async (_, args, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.RESTAURANT);
      return paginateOrders({ restaurantId: user.restaurantId! }, args);
    },
  },

  Mutation: {
    createOrder: async (_, { input }, ctx) => {
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
        throw new GraphQLError("Invalid menu items", { extensions: { code: "BAD_USER_INPUT" } });
      }
      const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
      let totalAmount = 0;
      const orderItems = input.items.map((item) => {
        const unitPrice = priceMap.get(item.menuItemId)!;
        totalAmount += unitPrice * item.quantity;
        return { menuItemId: item.menuItemId, quantity: item.quantity, unitPrice };
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
      return order;
    },

    acceptOrder: async (_, { orderId }, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.RESTAURANT);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.restaurantId !== user.restaurantId) {
        throw new GraphQLError("Order not found", { extensions: { code: "NOT_FOUND" } });
      }
      assertOrderTransition(order.status, OrderStatus.QUEUED);
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
      return updated;
    },

    rejectOrder: async (_, { orderId }, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.RESTAURANT);
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.restaurantId !== user.restaurantId) {
        throw new GraphQLError("Order not found", { extensions: { code: "NOT_FOUND" } });
      }
      assertOrderTransition(order.status, OrderStatus.RESTAURANT_REJECTED);
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
      return updated;
    },

    rateDriver: async (_, args, ctx) => {
      const user = requireAuth(ctx);
      requireRole(user, UserRole.CUSTOMER);
      if (args.score < 1 || args.score > 5) {
        throw new GraphQLError("Score must be between 1 and 5", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const order = await prisma.order.findUnique({
        where: { id: args.orderId },
        include: { delivery: true, rating: true },
      });
      if (!order || order.customerId !== user.customerId) {
        throw new GraphQLError("Order not found", { extensions: { code: "NOT_FOUND" } });
      }
      if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED) {
        throw new GraphQLError("Order not yet delivered", {
          extensions: { code: "INVALID_STATE_TRANSITION" },
        });
      }
      if (order.rating) {
        throw new GraphQLError("Already rated", { extensions: { code: "ALREADY_EXISTS" } });
      }
      return prisma.$transaction(async (tx) => {
        const r = await tx.rating.create({
          data: { orderId: args.orderId, score: args.score, comment: args.comment },
        });
        await tx.order.update({
          where: { id: args.orderId },
          data: { status: OrderStatus.COMPLETED },
        });
        if (order.delivery?.driverId) {
          // findMany runs after create, so ratings already includes the new one
          const ratings = await tx.rating.findMany({
            where: { order: { delivery: { driverId: order.delivery.driverId } } },
          });
          const avg = ratings.reduce((s, rating) => s + rating.score, 0) / ratings.length;
          await tx.driverProfile.update({
            where: { id: order.delivery.driverId },
            data: { rating: avg },
          });
        }
        return r;
      });
    },
  },

  Order: {
    items: (parent) =>
      parent.items ??
      prisma.orderItem.findMany({ where: { orderId: parent.id }, include: { menuItem: true } }),
    restaurant: (parent) =>
      parent.restaurant ??
      prisma.restaurant.findUniqueOrThrow({ where: { id: parent.restaurantId } }),
    delivery: (parent) =>
      parent.delivery !== undefined
        ? parent.delivery
        : prisma.delivery.findUnique({ where: { orderId: parent.id } }),
    rating: (parent) =>
      parent.rating !== undefined
        ? parent.rating
        : prisma.rating.findUnique({ where: { orderId: parent.id } }),
  },

  Restaurant: {
    menuItems: (parent) =>
      parent.menuItems ?? prisma.menuItem.findMany({ where: { restaurantId: parent.id } }),
  },
};
