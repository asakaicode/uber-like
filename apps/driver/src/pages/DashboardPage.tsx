import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { gql, formatDistance, formatPrice, formatStatus, useInfiniteScroll, WS_URL, getToken } from "@uber-like/web";
import { createClient } from "graphql-ws";

interface Offer {
  id: string;
  status: string;
  expiresAt: string;
  totalDistance: number | null;
  estimatedMinutes: number | null;
  reward: number | null;
  order: {
    id: string;
    deliveryLat: number;
    deliveryLng: number;
    restaurant: { name: string; lat: number; lng: number };
  };
}

interface ActiveDelivery {
  id: string;
  status: string;
  order: {
    id: string;
    status: string;
    deliveryLat: number;
    deliveryLng: number;
    restaurant: { name: string; lat: number; lng: number };
  };
}

const driverIcon = (heading: number) =>
  L.divIcon({
    className: "",
    html: `<div style="transform:rotate(${heading}deg);font-size:24px">⬆️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export function DashboardPage() {
  const [position, setPosition] = useState<[number, number]>([35.6812, 139.7671]);
  const [heading, setHeading] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<Offer | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const watchId = useRef<number | null>(null);

  const { data: offersData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["myOffers"],
    queryFn: ({ pageParam }) =>
      gql<{ myOffers: { edges: Array<{ node: { id: string; status: string; createdAt: string; order: { restaurant: { name: string } } } }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(
        `query($first: Int, $after: String) {
          myOffers(first: $first, after: $after) {
            edges { node { id status createdAt order { restaurant { name } } } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { first: 10, after: pageParam },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.myOffers.pageInfo.hasNextPage ? last.myOffers.pageInfo.endCursor : undefined,
  });
  const offersSentinelRef = useInfiniteScroll(hasNextPage, isFetchingNextPage, fetchNextPage);
  const offerHistory = offersData?.pages.flatMap((p) => p.myOffers.edges.map((e) => e.node)) ?? [];

  const updateLocation = useCallback(async (lat: number, lng: number, h: number) => {
    setPosition([lat, lng]);
    setHeading(h);
    if (isOnline) {
      await gql(
        `mutation($lat: Float!, $lng: Float!, $heading: Float) {
          updateDriverLocation(lat: $lat, lng: $lng, heading: $heading) { id }
        }`,
        { lat, lng, heading: h },
      ).catch(console.error);
    }
  }, [isOnline]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? heading),
      console.error,
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [updateLocation, heading]);

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.alpha != null) setHeading(e.alpha);
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || !isOnline) return;
    const client = createClient({
      url: WS_URL,
      connectionParams: { authorization: `Bearer ${token}` },
    });
    const dispose = client.subscribe(
      { query: `subscription { driverOfferReceived { id status expiresAt totalDistance estimatedMinutes reward order { id deliveryLat deliveryLng restaurant { name lat lng } } } }` },
      {
        next: (msg) => {
          const offer = (msg.data as { driverOfferReceived: Offer })?.driverOfferReceived;
          if (offer?.status === "PENDING") setPendingOffer(offer);
        },
        error: console.error,
        complete: () => {},
      },
    );
    return () => dispose();
  }, [isOnline]);

  useEffect(() => {
    async function loadActive() {
      const data = await gql<{ myActiveDelivery: ActiveDelivery | null }>(
        `query { myActiveDelivery { id status order { id status deliveryLat deliveryLng restaurant { name lat lng } } } }`,
      );
      setActiveDelivery(data.myActiveDelivery);
    }
    loadActive().catch(console.error);
  }, [pendingOffer]);

  useEffect(() => {
    if (!activeDelivery) return;
    const dest =
      activeDelivery.status === "PICKED_UP" || activeDelivery.order.status === "PICKED_UP"
        ? [activeDelivery.order.deliveryLat, activeDelivery.order.deliveryLng]
        : [activeDelivery.order.restaurant.lat, activeDelivery.order.restaurant.lng];
    fetchRoute(position[0], position[1], dest[0]!, dest[1]!);
  }, [activeDelivery, position]);

  async function fetchRoute(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      const coords = data.routes?.[0]?.geometry?.coordinates as number[][] | undefined;
      if (coords) setRoute(coords.map((c) => [c[1]!, c[0]!] as [number, number]));
    } catch {
      setRoute([[fromLat, fromLng], [toLat, toLng]]);
    }
  }

  async function toggleOnline() {
    const next = !isOnline;
    await gql(`mutation($isOnline: Boolean!) { setDriverOnline(isOnline: $isOnline) { id } }`, { isOnline: next });
    setIsOnline(next);
  }

  async function respondToOffer(accept: boolean) {
    if (!pendingOffer) return;
    await gql(
      `mutation($offerId: ID!, $accept: Boolean!) { respondToOffer(offerId: $offerId, accept: $accept) { id status } }`,
      { offerId: pendingOffer.id, accept },
    );
    if (accept) {
      const data = await gql<{ myActiveDelivery: ActiveDelivery | null }>(
        `query { myActiveDelivery { id status order { id status deliveryLat deliveryLng restaurant { name lat lng } } } }`,
      );
      setActiveDelivery(data.myActiveDelivery);
    }
    setPendingOffer(null);
  }

  async function confirmPickup() {
    if (!activeDelivery) return;
    await gql(`mutation($deliveryId: ID!) { confirmPickup(deliveryId: $deliveryId) { id status } }`, {
      deliveryId: activeDelivery.id,
    });
    const data = await gql<{ myActiveDelivery: ActiveDelivery | null }>(
      `query { myActiveDelivery { id status order { id status deliveryLat deliveryLng restaurant { name lat lng } } } }`,
    );
    setActiveDelivery(data.myActiveDelivery);
  }

  async function confirmDelivery() {
    if (!activeDelivery) return;
    await gql(`mutation($deliveryId: ID!) { confirmDelivery(deliveryId: $deliveryId) { id status } }`, {
      deliveryId: activeDelivery.id,
    });
    setActiveDelivery(null);
    setRoute([]);
  }

  useEffect(() => {
    if (pendingOffer) {
      const o = pendingOffer.order;
      fetchRoute(position[0], position[1], o.restaurant.lat, o.restaurant.lng);
    }
  }, [pendingOffer, position]);

  return (
    <div className="driver-layout">
      <div className="map-container">
        <MapContainer center={position} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater center={position} />
          <Marker position={position} icon={driverIcon(heading)} />
          {route.length > 0 && <Polyline positions={route} color="#2563eb" weight={4} />}
          {pendingOffer && (
            <>
              <Marker position={[pendingOffer.order.restaurant.lat, pendingOffer.order.restaurant.lng]} />
              <Marker position={[pendingOffer.order.deliveryLat, pendingOffer.order.deliveryLng]} />
            </>
          )}
          {activeDelivery && (
            <>
              <Marker position={[activeDelivery.order.restaurant.lat, activeDelivery.order.restaurant.lng]} />
              <Marker position={[activeDelivery.order.deliveryLat, activeDelivery.order.deliveryLng]} />
            </>
          )}
        </MapContainer>
      </div>

      <div className="map-controls">
        <button className={`btn ${isOnline ? "btn-success" : "btn-secondary"}`} onClick={toggleOnline}>
          {isOnline ? "オンライン" : "オフライン"}
        </button>
        <button className="btn btn-secondary" onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
          ログアウト
        </button>
      </div>

      {pendingOffer && (
        <div className="modal">
          <div className="modal-content">
            <h3>新しいオファー</h3>
            <p><strong>{pendingOffer.order.restaurant.name}</strong></p>
            {pendingOffer.totalDistance != null && <p>距離: {formatDistance(pendingOffer.totalDistance)}</p>}
            {pendingOffer.estimatedMinutes != null && <p>ETA: {pendingOffer.estimatedMinutes} 分</p>}
            {pendingOffer.reward != null && <p>報酬: {formatPrice(pendingOffer.reward)}</p>}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button className="btn btn-success" onClick={() => respondToOffer(true)}>承認</button>
              <button className="btn btn-danger" onClick={() => respondToOffer(false)}>拒否</button>
            </div>
          </div>
        </div>
      )}

      <div className="map-overlay">
        {activeDelivery && (
          <div className="card">
            <h3>配送中: {activeDelivery.order.restaurant.name}</h3>
            <p>ステータス: {activeDelivery.order.status}</p>
            {activeDelivery.status === "ASSIGNED" && (
              <button className="btn btn-success" onClick={confirmPickup}>商品を受取</button>
            )}
            {(activeDelivery.status === "PICKED_UP" || activeDelivery.order.status === "PICKED_UP") && (
              <button className="btn btn-success" onClick={confirmDelivery}>配達完了</button>
            )}
          </div>
        )}

        {offerHistory.length > 0 && (
          <div className="card">
            <h3>オファー履歴</h3>
            {offerHistory.map((o) => (
              <p key={o.id} style={{ margin: "0.25rem 0" }}>
                {o.order.restaurant.name} · {formatStatus(o.status)}
              </p>
            ))}
            <div ref={offersSentinelRef} className="sentinel" />
            {isFetchingNextPage && <div className="spinner">Loading...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
