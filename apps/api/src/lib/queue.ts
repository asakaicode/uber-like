import { Queue } from "bullmq";
import Redis from "ioredis";

export const DISPATCH_QUEUE = "dispatch-orders";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const dispatchQueue = new Queue(DISPATCH_QUEUE, {
  connection: connection as unknown as import("bullmq").ConnectionOptions,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

export async function enqueueOrder(orderId: string): Promise<void> {
  await dispatchQueue.add("dispatch", { orderId }, { jobId: orderId });
}
