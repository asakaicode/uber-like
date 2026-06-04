const OSRM_URL = process.env.OSRM_URL ?? "http://router.project-osrm.org";
const OFFER_TIMEOUT_MS = Number(process.env.OFFER_TIMEOUT_MS ?? 60000);
const BASE_REWARD = Number(process.env.BASE_REWARD ?? 500);
const REWARD_PER_KM = Number(process.env.REWARD_PER_KM ?? 150);

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
}

export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteInfo> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.statusText}`);
  const data = (await res.json()) as {
    routes: Array<{ distance: number; duration: number }>;
  };
  const route = data.routes[0];
  if (!route) throw new Error("No route found");
  return { distanceMeters: route.distance, durationSeconds: route.duration };
}

export function calculateReward(distanceKm: number): number {
  return Math.round(BASE_REWARD + REWARD_PER_KM * distanceKm);
}

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
