import { formatStatus } from "@uber-like/web";
import type { ActiveDelivery } from "../hooks/useActiveDelivery";

interface ActiveDeliveryCardProps {
  delivery: ActiveDelivery;
  onConfirmPickup: () => void;
  onConfirmDelivery: () => void;
}

export function ActiveDeliveryCard({
  delivery,
  onConfirmPickup,
  onConfirmDelivery,
}: ActiveDeliveryCardProps) {
  const isPicked =
    delivery.status === "PICKED_UP" || delivery.order.status === "PICKED_UP";

  return (
    <div className="card">
      <h3>配送中: {delivery.order.restaurant.name}</h3>
      <p>ステータス: {formatStatus(delivery.order.status)}</p>
      {delivery.status === "ASSIGNED" && (
        <button className="btn btn-success" onClick={onConfirmPickup}>
          商品を受取
        </button>
      )}
      {isPicked && (
        <button className="btn btn-success" onClick={onConfirmDelivery}>
          配達完了
        </button>
      )}
    </div>
  );
}
