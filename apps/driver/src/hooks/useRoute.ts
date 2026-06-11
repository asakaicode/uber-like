import { useEffect, useRef, useState } from "react";
import type { Offer } from "./usePendingOffer";
import type { ActiveDelivery } from "./useActiveDelivery";

export function useRoute(
  position: [number, number],
  pendingOffer: Offer | null,
  activeDelivery: ActiveDelivery | null,
) {
  const [route, setRoute] = useState<[number, number][]>([]);
  const positionRef = useRef(position);
  positionRef.current = position;

  // Recompute route only when the target destination changes, not on every GPS update
  const destKey = pendingOffer
    ? `offer-${pendingOffer.id}`
    : activeDelivery
      ? `delivery-${activeDelivery.id}-${activeDelivery.status}`
      : null;

  useEffect(() => {
    if (!destKey) {
      setRoute([]);
      return;
    }

    const pos = positionRef.current;

    async function compute() {
      if (pendingOffer) {
        const o = pendingOffer.order;
        fetchOsrmRoute(pos, [o.restaurant.lat, o.restaurant.lng]).then(setRoute).catch(() => {
          setRoute([pos, [o.restaurant.lat, o.restaurant.lng]]);
        });
        return;
      }
      if (activeDelivery) {
        const isPicked =
          activeDelivery.status === "PICKED_UP" ||
          activeDelivery.order.status === "PICKED_UP";
        const dest: [number, number] = isPicked
          ? [activeDelivery.order.deliveryLat, activeDelivery.order.deliveryLng]
          : [activeDelivery.order.restaurant.lat, activeDelivery.order.restaurant.lng];
        fetchOsrmRoute(pos, dest).then(setRoute).catch(() => {
          setRoute([pos, dest]);
        });
      }
    }

    compute().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destKey]);

  return { route };
}

async function fetchOsrmRoute(
  from: [number, number],
  to: [number, number],
): Promise<[number, number][]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = (await res.json()) as {
    routes?: Array<{ geometry?: { coordinates?: number[][] } }>;
  };
  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords) throw new Error("No route");
  return coords.map((c) => [c[1]!, c[0]!] as [number, number]);
}
