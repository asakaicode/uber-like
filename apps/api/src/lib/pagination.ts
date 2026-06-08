import {
  buildConnection,
  clampPageSize,
  decodeCursor,
  encodeCursor,
} from "@uber-like/shared";
import type { Prisma } from "@uber-like/database";

export function orderAfterFilter(after?: string | null): Prisma.OrderWhereInput {
  if (!after) return {};
  const { createdAt, id } = decodeCursor(after);
  return {
    OR: [
      { createdAt: { lt: createdAt } },
      { AND: [{ createdAt }, { id: { lt: id } }] },
    ],
  };
}

export function offerAfterFilter(after?: string | null): Prisma.DriverOfferWhereInput {
  if (!after) return {};
  const { createdAt, id } = decodeCursor(after);
  return {
    OR: [
      { createdAt: { lt: createdAt } },
      { AND: [{ createdAt }, { id: { lt: id } }] },
    ],
  };
}

export { buildConnection, clampPageSize, encodeCursor };

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: { include: { menuItem: true } };
    restaurant: true;
    delivery: { include: { driver: true } };
    rating: true;
  };
}>;

export type OfferWithRelations = Prisma.DriverOfferGetPayload<{
  include: {
    delivery: {
      include: {
        order: { include: { restaurant: true } };
      };
    };
    driver: true;
  };
}>;
