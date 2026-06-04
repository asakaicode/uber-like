import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { gql, formatPrice } from "@uber-like/web";

interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  menuItems: Array<{ id: string; name: string; price: number }>;
}

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () =>
      gql<{ restaurants: Restaurant[] }>(`query { restaurants { id name lat lng menuItems { id name price } } }`),
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
