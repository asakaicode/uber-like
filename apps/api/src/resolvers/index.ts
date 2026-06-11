import type { Resolvers } from "../generated/resolver-types.js";
import { authResolvers } from "./auth.js";
import { deliveryResolvers } from "./delivery.js";
import { orderResolvers } from "./order.js";
import { scalarsResolvers } from "./scalars.js";
import { subscriptionResolvers } from "./subscription.js";

function mergeResolvers(...partials: Partial<Resolvers>[]): Resolvers {
  const result: Record<string, unknown> = {};
  for (const partial of partials) {
    for (const [key, value] of Object.entries(partial)) {
      if (typeof value === "object" && value !== null && key in result) {
        result[key] = { ...(result[key] as Record<string, unknown>), ...value };
      } else {
        result[key] = value;
      }
    }
  }
  return result as Resolvers;
}

export const resolvers = mergeResolvers(
  scalarsResolvers,
  authResolvers,
  orderResolvers,
  deliveryResolvers,
  subscriptionResolvers,
);
