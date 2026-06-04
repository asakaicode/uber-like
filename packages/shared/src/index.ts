export enum UserRole {
  CUSTOMER = "CUSTOMER",
  RESTAURANT = "RESTAURANT",
  DRIVER = "DRIVER",
}

export enum OrderStatus {
  PENDING_RESTAURANT = "PENDING_RESTAURANT",
  RESTAURANT_REJECTED = "RESTAURANT_REJECTED",
  QUEUED = "QUEUED",
  OFFERED = "OFFERED",
  DRIVER_ASSIGNED = "DRIVER_ASSIGNED",
  PICKED_UP = "PICKED_UP",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
}

export enum OfferStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum DeliveryStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  PICKED_UP = "PICKED_UP",
  DELIVERED = "DELIVERED",
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const PUBSUB_CHANNELS = {
  ORDER_STATUS_CHANGED: "order:status",
  NEW_ORDER: "order:new",
  DRIVER_OFFER: "driver:offer",
  DRIVER_ASSIGNED: "driver:assigned",
  DRIVER_LOCATION: "driver:location",
} as const;

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
