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
