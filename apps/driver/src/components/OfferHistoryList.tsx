import { useInfiniteQuery } from "@tanstack/react-query";
import { gql, formatStatus, useInfiniteScroll } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

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

export function OfferHistoryList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["myOffers"],
    queryFn: ({ pageParam }) => gql(OFFER_HISTORY_QUERY, { first: 10, after: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.myOffers.pageInfo.hasNextPage ? last.myOffers.pageInfo.endCursor : undefined,
  });

  const sentinelRef = useInfiniteScroll(hasNextPage, isFetchingNextPage, fetchNextPage);

  const offerHistory =
    data?.pages.flatMap((p) => p.myOffers.edges.map((e) => e.node)) ?? [];

  if (offerHistory.length === 0) return null;

  return (
    <div className="card">
      <h3>オファー履歴</h3>
      {offerHistory.map((o) => (
        <p key={o.id} style={{ margin: "0.25rem 0" }}>
          {o.order.restaurant.name} · {formatStatus(o.status)}
        </p>
      ))}
      <div ref={sentinelRef} className="sentinel" />
      {isFetchingNextPage && <div className="spinner">Loading...</div>}
    </div>
  );
}
