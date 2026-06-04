const OSRM_URL = process.env.OSRM_URL ?? "http://router.project-osrm.org";

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoJSON.LineString;
}

export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteResult> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.statusText}`);
  const data = (await res.json()) as {
    routes: Array<{ distance: number; duration: number; geometry: GeoJSON.LineString }>;
  };
  const route = data.routes[0];
  if (!route) throw new Error("No route found");
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
  };
}

export async function getMultiLegRoute(
  points: Array<{ lat: number; lng: number }>,
): Promise<RouteResult> {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.statusText}`);
  const data = (await res.json()) as {
    routes: Array<{ distance: number; duration: number; geometry: GeoJSON.LineString }>;
  };
  const route = data.routes[0];
  if (!route) throw new Error("No route found");
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
  };
}

export function calculateReward(distanceKm: number): number {
  const base = Number(process.env.BASE_REWARD ?? 500);
  const perKm = Number(process.env.REWARD_PER_KM ?? 150);
  return Math.round(base + perKm * distanceKm);
}

declare namespace GeoJSON {
  interface LineString {
    type: "LineString";
    coordinates: number[][];
  }
}
