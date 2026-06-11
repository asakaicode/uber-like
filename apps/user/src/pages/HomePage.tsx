import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { gql, formatPrice } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

const RESTAURANTS_QUERY = graphql(`
  query Restaurants {
    restaurants {
      id
      name
      lat
      lng
      menuItems {
        id
        name
        price
      }
    }
  }
`);

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => gql(RESTAURANTS_QUERY),
  });

  if (isLoading) return <div className="spinner">Loading...</div>;

  return (
    <div className="container">
      <h2>店舗一覧</h2>
      {data?.restaurants.map((r) => (
        <Link key={r.id} to="/restaurant/$id" params={{ id: r.id }}>
          <div className="card">
            <h3>{r.name}</h3>
            <p>{r.menuItems.length} items · from {formatPrice(Math.min(...r.menuItems.map((m) => m.price)))}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
