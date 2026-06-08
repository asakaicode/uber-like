import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { gql, formatPrice, formatStatus, useInfiniteScroll, WS_URL, getToken, getRestaurantId } from "@uber-like/web";
import { createClient } from "graphql-ws";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  deliveryAddress: string;
  delivery?: { driver?: { name: string; rating: number } };
  items: Array<{ quantity: number; menuItem: { name: string } }>;
}

const ORDERS_QUERY = `query RestaurantOrders($first: Int, $after: String, $status: OrderStatus) {
  restaurantOrders(first: $first, after: $after, status: $status) {
    edges { cursor node {
      id status totalAmount createdAt deliveryAddress
      delivery { driver { name rating } }
      items { quantity menuItem { name } }
    }}
    pageInfo { hasNextPage endCursor }
  }
}`;

export function OrdersPage() {
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQuery({
    queryKey: ["restaurantOrders"],
    queryFn: ({ pageParam }) =>
      gql<{ restaurantOrders: { edges: Array<{ cursor: string; node: Order }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(
        ORDERS_QUERY,
        { first: 20, after: pageParam },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.restaurantOrders.pageInfo.hasNextPage ? last.restaurantOrders.pageInfo.endCursor : undefined,
  });

  const sentinelRef = useInfiniteScroll(hasNextPage, isFetchingNextPage, fetchNextPage);

  useEffect(() => {
    const token = getToken();
    const restaurantId = getRestaurantId();
    if (!token || !restaurantId) return;
    const client = createClient({
      url: WS_URL,
      connectionParams: { authorization: `Bearer ${token}` },
    });
    const dispose = client.subscribe(
      {
        query: `subscription($restaurantId: ID!) { newOrder(restaurantId: $restaurantId) { id } }`,
        variables: { restaurantId },
      },
      {
        next: () => refetch(),
        error: () => {},
        complete: () => {},
      },
    );
    return () => dispose();
  }, [refetch]);

  async function acceptOrder(orderId: string) {
    await gql(`mutation($orderId: ID!) { acceptOrder(orderId: $orderId) { id } }`, { orderId });
    queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
  }

  async function rejectOrder(orderId: string) {
    await gql(`mutation($orderId: ID!) { rejectOrder(orderId: $orderId) { id } }`, { orderId });
    queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
  }

  if (isLoading) return <div className="spinner">Loading...</div>;

  const orders = data?.pages.flatMap((p) => p.restaurantOrders.edges.map((e) => e.node)) ?? [];

  return (
    <div className="container">
      <h2>注文受信箱</h2>
      {orders.map((order) => (
        <div key={order.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <strong>{formatPrice(order.totalAmount)}</strong>
            <span className="badge">{formatStatus(order.status)}</span>
          </div>
          <p>{order.deliveryAddress}</p>
          <ul>
            {order.items.map((item, i) => (
              <li key={i}>{item.menuItem.name} x{item.quantity}</li>
            ))}
          </ul>
          {order.delivery?.driver && (
            <p>ドライバー: {order.delivery.driver.name} (★ {order.delivery.driver.rating.toFixed(1)})</p>
          )}
          {order.status === "PENDING_RESTAURANT" && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button className="btn btn-success" onClick={() => acceptOrder(order.id)}>承認</button>
              <button className="btn btn-danger" onClick={() => rejectOrder(order.id)}>拒否</button>
            </div>
          )}
        </div>
      ))}
      <div ref={sentinelRef} className="sentinel" />
      {isFetchingNextPage && <div className="spinner">Loading more...</div>}
    </div>
  );
}
