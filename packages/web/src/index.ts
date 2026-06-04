import classNames from "classnames";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/graphql";
export const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000/graphql";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function setProfileIds(ids: { restaurantId?: string; customerId?: string; driverId?: string }): void {
  if (ids.restaurantId) localStorage.setItem("restaurantId", ids.restaurantId);
  if (ids.customerId) localStorage.setItem("customerId", ids.customerId);
  if (ids.driverId) localStorage.setItem("driverId", ids.driverId);
}

export function getRestaurantId(): string | null {
  return localStorage.getItem("restaurantId");
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = getToken();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0]!.message);
  return json.data as T;
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").toLowerCase();
}

export function formatPrice(yen: number): string {
  return `¥${yen.toLocaleString()}`;
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export { useInfiniteScroll } from "./useInfiniteScroll";
export { classNames };
