import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  gql,
  formatPrice,
  formatStatus,
  useInfiniteScroll,
  useSubscription,
  getRestaurantId,
} from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

const ORDERS_QUERY = graphql(`
  query RestaurantOrders($first: Int, $after: String, $status: OrderStatus) {
    restaurantOrders(first: $first, after: $after, status: $status) {
      edges {
        cursor
        node {
          id
          status
          totalAmount
          createdAt
          deliveryAddress
          delivery {
            id
            driver {
              id
              name
              rating
            }
          }
          items {
            id
            quantity
            menuItem {
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

const NEW_ORDER_SUBSCRIPTION = graphql(`
  subscription NewOrder($restaurantId: ID!) {
    newOrder(restaurantId: $restaurantId) {
      id
    }
  }
`);

const ACCEPT_ORDER_MUTATION = graphql(`
  mutation AcceptOrder($orderId: ID!) {
    acceptOrder(orderId: $orderId) {
      id
      status
    }
  }
`);

const REJECT_ORDER_MUTATION = graphql(`
  mutation RejectOrder($orderId: ID!) {
    rejectOrder(orderId: $orderId) {
      id
      status
    }
  }
`);

export function OrdersPage() {
  const queryClient = useQueryClient();
  const restaurantId = getRestaurantId() ?? "";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["restaurantOrders"],
    queryFn: ({ pageParam }) => gql(ORDERS_QUERY, { first: 20, after: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.restaurantOrders.pageInfo.hasNextPage
        ? last.restaurantOrders.pageInfo.endCursor
        : undefined,
  });

  const sentinelRef = useInfiniteScroll(hasNextPage, isFetchingNextPage, fetchNextPage);

  useSubscription(
    NEW_ORDER_SUBSCRIPTION,
    { restaurantId },
    () => { queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] }); },
    !!restaurantId,
  );

  async function acceptOrder(orderId: string) {
    await gql(ACCEPT_ORDER_MUTATION, { orderId });
    queryClient.invalidateQueries({ queryKey: ["restaurantOrders"] });
  }

  async function rejectOrder(orderId: string) {
    await gql(REJECT_ORDER_MUTATION, { orderId });
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
            {order.items.map((item) => (
              <li key={item.id}>
                {item.menuItem.name} x{item.quantity}
              </li>
            ))}
          </ul>
          {order.delivery?.driver && (
            <p>
              ドライバー: {order.delivery.driver.name} (★{" "}
              {order.delivery.driver.rating.toFixed(1)})
            </p>
          )}
          {order.status === "PENDING_RESTAURANT" && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button className="btn btn-success" onClick={() => acceptOrder(order.id)}>
                承認
              </button>
              <button className="btn btn-danger" onClick={() => rejectOrder(order.id)}>
                拒否
              </button>
            </div>
          )}
        </div>
      ))}
      <div ref={sentinelRef} className="sentinel" />
      {isFetchingNextPage && <div className="spinner">Loading more...</div>}
    </div>
  );
}
