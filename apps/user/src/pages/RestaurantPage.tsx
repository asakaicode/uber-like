import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { gql, formatPrice } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

const RESTAURANT_QUERY = graphql(`
  query RestaurantDetail($id: ID!) {
    restaurant(id: $id) {
      id
      name
      menuItems {
        id
        name
        price
        isAvailable
      }
    }
  }
`);

const CREATE_ORDER_MUTATION = graphql(`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
    }
  }
`);

export function RestaurantPage() {
  const { id } = useParams({ from: "/authed/restaurant/$id" });
  const navigate = useNavigate();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [address, setAddress] = useState("Tokyo Station");
  const [lat, setLat] = useState(35.6812);
  const [lng, setLng] = useState(139.7671);

  const { data } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => gql(RESTAURANT_QUERY, { id }),
  });

  const restaurant = data?.restaurant;
  if (!restaurant) return <div className="spinner">Loading...</div>;

  function addToCart(menuItemId: string) {
    setCart((c) => ({ ...c, [menuItemId]: (c[menuItemId] ?? 0) + 1 }));
  }

  async function placeOrder() {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (items.length === 0) return;

    const result = await gql(CREATE_ORDER_MUTATION, {
      input: {
        restaurantId: id,
        items,
        deliveryAddress: address,
        deliveryLat: lat,
        deliveryLng: lng,
      },
    });
    navigate({ to: "/orders/$id", params: { id: result.createOrder.id } });
  }

  const total = restaurant.menuItems.reduce(
    (sum, m) => sum + (cart[m.id] ?? 0) * m.price,
    0,
  );

  return (
    <div className="container">
      <h2>{restaurant.name}</h2>
      {restaurant.menuItems.map((item) => (
        <div key={item.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{item.name}</strong>
            <div>{formatPrice(item.price)}</div>
          </div>
          <button className="btn btn-secondary" onClick={() => addToCart(item.id)}>
            追加 ({cart[item.id] ?? 0})
          </button>
        </div>
      ))}

      <div className="card">
        <h3>配送先</h3>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input className="input" type="number" step="0.0001" value={lat} onChange={(e) => setLat(Number(e.target.value))} placeholder="Lat" />
          <input className="input" type="number" step="0.0001" value={lng} onChange={(e) => setLng(Number(e.target.value))} placeholder="Lng" />
        </div>
        <p><strong>合計: {formatPrice(total)}</strong></p>
        <button className="btn" onClick={placeOrder} disabled={total === 0}>注文する</button>
      </div>
    </div>
  );
}
