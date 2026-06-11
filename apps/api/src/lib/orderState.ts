import { DeliveryStatus, OrderStatus } from "@uber-like/database";
import { GraphQLError } from "graphql";

const ORDER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING_RESTAURANT]: [OrderStatus.QUEUED, OrderStatus.RESTAURANT_REJECTED],
  [OrderStatus.QUEUED]: [OrderStatus.OFFERED],
  [OrderStatus.OFFERED]: [OrderStatus.DRIVER_ASSIGNED],
  [OrderStatus.DRIVER_ASSIGNED]: [OrderStatus.PICKED_UP],
  [OrderStatus.PICKED_UP]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
};

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  const allowed = ORDER_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new GraphQLError(`Cannot transition order from ${from} to ${to}`, {
      extensions: { code: "INVALID_STATE_TRANSITION" },
    });
  }
}

const DELIVERY_TRANSITIONS: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  [DeliveryStatus.PENDING]: [DeliveryStatus.ASSIGNED],
  [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP],
  [DeliveryStatus.PICKED_UP]: [DeliveryStatus.DELIVERED],
};

export function assertDeliveryTransition(from: DeliveryStatus, to: DeliveryStatus): void {
  const allowed = DELIVERY_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new GraphQLError(`Cannot transition delivery from ${from} to ${to}`, {
      extensions: { code: "INVALID_STATE_TRANSITION" },
    });
  }
}
