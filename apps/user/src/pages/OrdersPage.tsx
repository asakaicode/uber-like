import { Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { gql, formatPrice, formatStatus, useInfiniteScroll } from "@uber-like/web";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  restaurant: { name: string };
}

interface OrdersData {
  orders: {
    edges: Array<{ cursor: string; node: Order }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

const ORDERS_QUERY = `query Orders($first: Int, $after: String) {
  orders(first: $first, after: $after) {
    edges { cursor node { id status totalAmount createdAt restaurant { name } } }
    pageInfo { hasNextPage endCursor }
  }
}`;

export function OrdersPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["orders"],
    queryFn: ({ pageParam }) =>
      gql<OrdersData>(ORDERS_QUERY, { first: 20, after: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.orders.pageInfo.hasNextPage ? last.orders.pageInfo.endCursor : undefined,
  });

  const sentinelRef = useInfiniteScroll(hasNextPage, isFetchingNextPage, fetchNextPage);

  if (isLoading) return <div className="spinner">Loading...</div>;

  const orders = data?.pages.flatMap((p) => p.orders.edges.map((e) => e.node)) ?? [];

  return (
    <div className="container">
      <h2>注文履歴</h2>
      {orders.map((order) => (
        <Link key={order.id} to="/orders/$id" params={{ id: order.id }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{order.restaurant.name}</strong>
              <span className="badge">{formatStatus(order.status)}</span>
            </div>
            <p>{formatPrice(order.totalAmount)} · {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </Link>
      ))}
      <div ref={sentinelRef} className="sentinel" />
      {isFetchingNextPage && <div className="spinner">Loading more...</div>}
    </div>
  );
}
