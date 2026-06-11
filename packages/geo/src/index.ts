export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: { type: "LineString"; coordinates: number[][] };
}

const OSRM_URL = process.env.OSRM_URL ?? "http://router.project-osrm.org";

async function fetchRoute(coordStr: string): Promise<RouteResult> {
  const url = `${OSRM_URL}/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.statusText}`);
  const data = (await res.json()) as {
    routes: Array<{
      distance: number;
      duration: number;
      geometry: { type: "LineString"; coordinates: number[][] };
    }>;
  };
  const route = data.routes[0];
  if (!route) throw new Error("No route found");
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
  };
}

export function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteResult> {
  return fetchRoute(`${from.lng},${from.lat};${to.lng},${to.lat}`);
}

export function getMultiLegRoute(
  points: Array<{ lat: number; lng: number }>,
): Promise<RouteResult> {
  return fetchRoute(points.map((p) => `${p.lng},${p.lat}`).join(";"));
}

export function calculateReward(distanceKm: number): number {
  const base = Number(process.env.BASE_REWARD ?? 500);
  const perKm = Number(process.env.REWARD_PER_KM ?? 150);
  return Math.round(base + perKm * distanceKm);
}
