import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import { gql, formatPrice, formatStatus, WS_URL, getToken } from "@uber-like/web";
import { createClient } from "graphql-ws";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  restaurant: { name: string; lat: number; lng: number };
  delivery?: {
    id: string;
    driver?: { id: string; name: string; rating: number; lat: number | null; lng: number | null; heading: number | null };
  };
}

const ORDER_QUERY = `query Order($id: ID!) {
  order(id: $id) {
    id status totalAmount deliveryAddress deliveryLat deliveryLng
    restaurant { name lat lng }
    delivery { id driver { id name rating lat lng heading } }
  }
}`;

export function OrderTrackPage() {
  const { id } = useParams({ from: "/authed/orders/$id" });
  const queryClient = useQueryClient();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [rated, setRated] = useState(false);

  const { data } = useQuery({
    queryKey: ["order", id],
    queryFn: () => gql<{ order: Order }>(ORDER_QUERY, { id }),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const client = createClient({
      url: WS_URL,
      connectionParams: { authorization: `Bearer ${token}` },
    });
    const dispose = client.subscribe(
      {
        query: `subscription($orderId: ID!) {
          orderStatusChanged(orderId: $orderId) { id status delivery { driver { id name rating lat lng heading } } }
        }`,
        variables: { orderId: id },
      },
      {
        next: () => queryClient.invalidateQueries({ queryKey: ["order", id] }),
        error: console.error,
        complete: () => {},
      },
    );
    return () => dispose();
  }, [id, queryClient]);

  const order = data?.order;
  if (!order) return <div className="spinner">Loading...</div>;

  const driver = order.delivery?.driver;
  const center: [number, number] = driver?.lat && driver?.lng
    ? [driver.lat, driver.lng]
    : [order.deliveryLat, order.deliveryLng];

  async function handleRate() {
    await gql(
      `mutation($orderId: ID!, $score: Int!, $comment: String) {
        rateDriver(orderId: $orderId, score: $score, comment: $comment) { id }
      }`,
      { orderId: id, score, comment },
    );
    setRated(true);
    queryClient.invalidateQueries({ queryKey: ["order", id] });
  }

  return (
    <div className="container">
      <h2>{order.restaurant.name}</h2>
      <p className="badge badge-active">{formatStatus(order.status)}</p>
      <p>{order.deliveryAddress}</p>
      <p>{formatPrice(order.totalAmount)}</p>

      {driver && (
        <div className="card">
          <h3>ドライバー</h3>
          <p>{driver.name} · ★ {driver.rating.toFixed(1)}</p>
        </div>
      )}

      {(order.status === "DRIVER_ASSIGNED" || order.status === "PICKED_UP" || order.status === "DELIVERED") && (
        <div style={{ height: 300, marginBottom: "1rem", borderRadius: 12, overflow: "hidden" }}>
          <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[order.restaurant.lat, order.restaurant.lng]} />
            <Marker position={[order.deliveryLat, order.deliveryLng]} />
            {driver?.lat && driver?.lng && <Marker position={[driver.lat, driver.lng]} />}
            {driver?.lat && driver?.lng && (
              <Polyline
                positions={[
                  [driver.lat, driver.lng],
                  order.status === "PICKED_UP" || order.status === "DELIVERED"
                    ? [order.deliveryLat, order.deliveryLng]
                    : [order.restaurant.lat, order.restaurant.lng],
                ]}
                color="#2563eb"
              />
            )}
          </MapContainer>
        </div>
      )}

      {order.status === "DELIVERED" && !rated && (
        <div className="card">
          <h3>ドライバーを評価</h3>
          <input className="input" type="number" min={1} max={5} value={score} onChange={(e) => setScore(Number(e.target.value))} />
          <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="コメント（任意）" />
          <button className="btn" onClick={handleRate}>送信</button>
        </div>
      )}
      {rated && <p>評価ありがとうございました！</p>}
    </div>
  );
}
