export { getRoute, calculateReward, type RouteResult } from "@uber-like/geo";

const OFFER_TIMEOUT_MS = Number(process.env.OFFER_TIMEOUT_MS ?? 60000);

export function getOfferExpiry(): Date {
  return new Date(Date.now() + OFFER_TIMEOUT_MS);
}

export function scoreDriver(
  driverToRestaurant: number,
  restaurantToCustomer: number,
  rating: number,
): number {
  const w1 = 1.0;
  const w2 = 0.8;
  const w3 = 100;
  return w1 * driverToRestaurant + w2 * restaurantToCustomer + w3 * (1 / Math.max(rating, 1));
}
