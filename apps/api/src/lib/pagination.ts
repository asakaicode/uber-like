import type { Prisma } from "@uber-like/database";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@uber-like/shared";

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface Connection<T> {
  edges: Array<{ cursor: string; node: T }>;
  pageInfo: PageInfo;
}

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}:${id}`).toString("base64url");
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
  const lastColon = decoded.lastIndexOf(":");
  if (lastColon === -1) throw new Error("Invalid cursor");
  const iso = decoded.slice(0, lastColon);
  const id = decoded.slice(lastColon + 1);
  if (!iso || !id) throw new Error("Invalid cursor");
  return { createdAt: new Date(iso), id };
}

export function clampPageSize(first?: number | null): number {
  const size = first ?? DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, size), MAX_PAGE_SIZE);
}

export function buildConnection<T extends { id: string; createdAt: Date }>(
  items: T[],
  requestedSize: number,
  getCursor: (item: T) => string = (item) => encodeCursor(item.createdAt, item.id),
): Connection<T> {
  const hasNextPage = items.length > requestedSize;
  const nodes = hasNextPage ? items.slice(0, requestedSize) : items;
  const edges = nodes.map((node) => ({
    cursor: getCursor(node),
    node,
  }));
  return {
    edges,
    pageInfo: {
      hasNextPage,
      endCursor: edges.length > 0 ? edges[edges.length - 1]!.cursor : null,
    },
  };
}

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
