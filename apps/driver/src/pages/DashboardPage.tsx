import { useState } from "react";
import { gql, classNames, logout } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";
import { useDriverPosition } from "../hooks/useDriverPosition";
import { usePendingOffer } from "../hooks/usePendingOffer";
import { useActiveDelivery } from "../hooks/useActiveDelivery";
import { useRoute } from "../hooks/useRoute";
import { DriverMap } from "../components/DriverMap";
import { OfferModal } from "../components/OfferModal";
import { ActiveDeliveryCard } from "../components/ActiveDeliveryCard";
import { OfferHistoryList } from "../components/OfferHistoryList";

const SET_ONLINE_MUTATION = graphql(`
  mutation SetDriverOnline($isOnline: Boolean!) {
    setDriverOnline(isOnline: $isOnline) {
      id
    }
  }
`);

export function DashboardPage() {
  const [isOnline, setIsOnline] = useState(false);

  const { position, heading } = useDriverPosition(isOnline);

  const { pendingOffer, setPendingOffer, responding, offerError, loadPendingOffer, respondToOffer } =
    usePendingOffer(isOnline);

  const { activeDelivery, setActiveDelivery, confirmPickup, confirmDelivery } =
    useActiveDelivery(pendingOffer);

  const { route } = useRoute(position, pendingOffer, activeDelivery);

  async function toggleOnline() {
    const next = !isOnline;
    await gql(SET_ONLINE_MUTATION, { isOnline: next });
    setIsOnline(next);
    if (next) {
      await loadPendingOffer().catch(console.error);
    } else {
      setPendingOffer(null);
    }
  }

  async function handleAcceptOffer() {
    const accepted = await respondToOffer(true);
    if (accepted) {
      // activeDelivery will be refreshed via useActiveDelivery's pendingOffer dependency
    }
  }

  async function handleDeliveryComplete() {
    await confirmDelivery();
    setActiveDelivery(null);
  }

  return (
    <div className={classNames("driver-layout", { "driver-layout--offer-open": pendingOffer })}>
      <div className="map-container">
        <DriverMap
          position={position}
          heading={heading}
          route={route}
          pendingOffer={pendingOffer}
          activeDelivery={activeDelivery}
        />
      </div>

      <div className="map-controls">
        <button
          className={classNames("btn", { "btn-success": isOnline, "btn-secondary": !isOnline })}
          onClick={toggleOnline}
        >
          {isOnline ? "オンライン" : "オフライン"}
        </button>
        <button className="btn btn-secondary" onClick={logout}>
          ログアウト
        </button>
      </div>

      {pendingOffer && (
        <OfferModal
          offer={pendingOffer}
          responding={responding}
          error={offerError}
          onAccept={handleAcceptOffer}
          onReject={() => respondToOffer(false)}
          onDismiss={() => !responding && setPendingOffer(null)}
        />
      )}

      <div className="map-overlay">
        {activeDelivery && (
          <ActiveDeliveryCard
            delivery={activeDelivery}
            onConfirmPickup={confirmPickup}
            onConfirmDelivery={handleDeliveryComplete}
          />
        )}
        <OfferHistoryList />
      </div>
    </div>
  );
}
