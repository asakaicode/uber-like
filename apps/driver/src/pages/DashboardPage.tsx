import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import {
  gql,
  formatDistance,
  formatPrice,
  formatStatus,
  printDocument,
  useInfiniteScroll,
  WS_URL,
  getToken,
  classNames,
  type ResultOf,
} from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";
import { createClient } from "graphql-ws";

const OFFER_FIELDS = graphql(`
  fragment OfferFields on DriverOffer {
    id
    status
    expiresAt
    totalDistance
    estimatedMinutes
    reward
    order {
      id
      deliveryLat
      deliveryLng
      restaurant {
        name
        lat
        lng
      }
    }
  }
`);

const PENDING_OFFERS_QUERY = graphql(`
  query PendingOffers($first: Int, $status: OfferStatus) {
    myOffers(first: $first, status: $status) {
      edges {
        node {
          ...OfferFields
        }
      }
    }
  }
`);

const OFFER_HISTORY_QUERY = graphql(`
  query OfferHistory($first: Int, $after: String) {
    myOffers(first: $first, after: $after) {
      edges {
        node {
          id
          status
          createdAt
          order {
            id
            restaurant {
              name
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

const DRIVER_OFFER_SUBSCRIPTION = graphql(`
  subscription DriverOfferReceived {
    driverOfferReceived {
      ...OfferFields
    }
  }
`);

const ACTIVE_DELIVERY_QUERY = graphql(`
  query MyActiveDelivery {
    myActiveDelivery {
      id
      status
      order {
        id
        status
        deliveryLat
        deliveryLng
        restaurant {
          name
          lat
          lng
        }
      }
    }
  }
`);

const SET_ONLINE_MUTATION = graphql(`
  mutation SetDriverOnline($isOnline: Boolean!) {
    setDriverOnline(isOnline: $isOnline) {
      id
    }
  }
`);

const UPDATE_LOCATION_MUTATION = graphql(`
  mutation UpdateDriverLocation($lat: Float!, $lng: Float!, $heading: Float) {
    updateDriverLocation(lat: $lat, lng: $lng, heading: $heading) {
      id
    }
  }
`);

const RESPOND_TO_OFFER_MUTATION = graphql(`
  mutation RespondToOffer($offerId: ID!, $accept: Boolean!) {
    respondToOffer(offerId: $offerId, accept: $accept) {
      id
      status
    }
  }
`);

const CONFIRM_PICKUP_MUTATION = graphql(`
  mutation ConfirmPickup($deliveryId: ID!) {
    confirmPickup(deliveryId: $deliveryId) {
      id
      status
    }
  }
`);

const CONFIRM_DELIVERY_MUTATION = graphql(`
  mutation ConfirmDelivery($deliveryId: ID!) {
    confirmDelivery(deliveryId: $deliveryId) {
      id
      status
    }
  }
`);

type Offer = ResultOf<typeof OFFER_FIELDS>;
type ActiveDelivery = NonNullable<ResultOf<typeof ACTIVE_DELIVERY_QUERY>["myActiveDelivery"]>;

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
  const [responding, setResponding] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  async function loadPendingOffer() {
    const data = await gql(PENDING_OFFERS_QUERY, { first: 1, status: "PENDING" });
    const offer = data.myOffers.edges[0]?.node ?? null;
    if (offer && new Date(offer.expiresAt) > new Date()) {
      setPendingOffer(offer);
    }
  }

  const { data: offersData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["myOffers"],
    queryFn: ({ pageParam }) => gql(OFFER_HISTORY_QUERY, { first: 10, after: pageParam }),
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
      await gql(UPDATE_LOCATION_MUTATION, { lat, lng, heading: h }).catch(console.error);
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
      { query: printDocument(DRIVER_OFFER_SUBSCRIPTION) },
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
      const data = await gql(ACTIVE_DELIVERY_QUERY);
      setActiveDelivery(data.myActiveDelivery ?? null);
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
    await gql(SET_ONLINE_MUTATION, { isOnline: next });
    setIsOnline(next);
    if (next) {
      await loadPendingOffer().catch(console.error);
    } else {
      setPendingOffer(null);
    }
  }

  async function respondToOffer(accept: boolean) {
    if (!pendingOffer || responding) return;
    setResponding(true);
    setOfferError(null);
    try {
      await gql(RESPOND_TO_OFFER_MUTATION, { offerId: pendingOffer.id, accept });
      if (accept) {
        const data = await gql(ACTIVE_DELIVERY_QUERY);
        setActiveDelivery(data.myActiveDelivery ?? null);
      }
      setPendingOffer(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "リクエストに失敗しました";
      setOfferError(message);
      if (message.includes("expired") || message.includes("already responded") || message.includes("not found")) {
        setPendingOffer(null);
      }
    } finally {
      setResponding(false);
    }
  }

  async function confirmPickup() {
    if (!activeDelivery) return;
    await gql(CONFIRM_PICKUP_MUTATION, { deliveryId: activeDelivery.id });
    const data = await gql(ACTIVE_DELIVERY_QUERY);
    setActiveDelivery(data.myActiveDelivery ?? null);
  }

  async function confirmDelivery() {
    if (!activeDelivery) return;
    await gql(CONFIRM_DELIVERY_MUTATION, { deliveryId: activeDelivery.id });
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
    <div className={classNames("driver-layout", { "driver-layout--offer-open": pendingOffer })}>
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
        <button
          className={classNames("btn", { "btn-success": isOnline, "btn-secondary": !isOnline })}
          onClick={toggleOnline}
        >
          {isOnline ? "オンライン" : "オフライン"}
        </button>
        <button className="btn btn-secondary" onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
          ログアウト
        </button>
      </div>

      {pendingOffer && (
        <div className="modal" onClick={() => !responding && setPendingOffer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>新しいオファー</h3>
            <p><strong>{pendingOffer.order.restaurant.name}</strong></p>
            {pendingOffer.totalDistance != null && <p>距離: {formatDistance(pendingOffer.totalDistance)}</p>}
            {pendingOffer.estimatedMinutes != null && <p>ETA: {pendingOffer.estimatedMinutes} 分</p>}
            {pendingOffer.reward != null && <p>報酬: {formatPrice(pendingOffer.reward)}</p>}
            {offerError && <p className="modal-error">{offerError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-success" disabled={responding} onClick={() => respondToOffer(true)}>
                {responding ? "送信中..." : "承認"}
              </button>
              <button type="button" className="btn btn-danger" disabled={responding} onClick={() => respondToOffer(false)}>
                {responding ? "送信中..." : "拒否"}
              </button>
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
