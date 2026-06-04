import Redis from "ioredis";
import { PUBSUB_CHANNELS } from "@uber-like/shared";

export const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
export const redisSub = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

export async function publishEvent(channel: string, payload: unknown): Promise<void> {
  await redis.publish(channel, JSON.stringify(payload));
}

export { PUBSUB_CHANNELS };

export type PubSubEvent =
  | { type: typeof PUBSUB_CHANNELS.ORDER_STATUS_CHANGED; orderId: string; status: string; customerId: string; restaurantId: string }
  | { type: typeof PUBSUB_CHANNELS.NEW_ORDER; orderId: string; restaurantId: string }
  | { type: typeof PUBSUB_CHANNELS.DRIVER_OFFER; offerId: string; driverId: string }
  | { type: typeof PUBSUB_CHANNELS.DRIVER_ASSIGNED; orderId: string; driverId: string; customerId: string; restaurantId: string }
  | { type: typeof PUBSUB_CHANNELS.DRIVER_LOCATION; deliveryId: string; lat: number; lng: number; heading: number };

export async function publishTyped(event: PubSubEvent): Promise<void> {
  await publishEvent(event.type, event);
}
