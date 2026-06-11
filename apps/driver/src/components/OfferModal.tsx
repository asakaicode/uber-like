import { formatDistance, formatPrice } from "@uber-like/web";
import type { Offer } from "../hooks/usePendingOffer";

interface OfferModalProps {
  offer: Offer;
  responding: boolean;
  error: string | null;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
}

export function OfferModal({
  offer,
  responding,
  error,
  onAccept,
  onReject,
  onDismiss,
}: OfferModalProps) {
  return (
    <div className="modal" onClick={() => !responding && onDismiss()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>新しいオファー</h3>
        <p>
          <strong>{offer.order.restaurant.name}</strong>
        </p>
        {offer.totalDistance != null && <p>距離: {formatDistance(offer.totalDistance)}</p>}
        {offer.estimatedMinutes != null && <p>ETA: {offer.estimatedMinutes} 分</p>}
        {offer.reward != null && <p>報酬: {formatPrice(offer.reward)}</p>}
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-success"
            disabled={responding}
            onClick={onAccept}
          >
            {responding ? "送信中..." : "承認"}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={responding}
            onClick={onReject}
          >
            {responding ? "送信中..." : "拒否"}
          </button>
        </div>
      </div>
    </div>
  );
}
