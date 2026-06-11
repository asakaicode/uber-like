import { useEffect, useState } from "react";
import { gql, type ResultOf } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";
import type { Offer } from "./usePendingOffer";

const ACTIVE_DELIVERY_QUERY = graphql(`
  query ActiveDelivery {
    myActiveDelivery {
      id
      status
      order {
        id
        status
        deliveryLat
        deliveryLng
        restaurant {
          name
          lat
          lng
        }
      }
    }
  }
`);

const CONFIRM_PICKUP_MUTATION = graphql(`
  mutation ConfirmPickup($deliveryId: ID!) {
    confirmPickup(deliveryId: $deliveryId) {
      id
      status
    }
  }
`);

const CONFIRM_DELIVERY_MUTATION = graphql(`
  mutation ConfirmDelivery($deliveryId: ID!) {
    confirmDelivery(deliveryId: $deliveryId) {
      id
      status
    }
  }
`);

export type ActiveDelivery = NonNullable<ResultOf<typeof ACTIVE_DELIVERY_QUERY>["myActiveDelivery"]>;

async function fetchActiveDelivery() {
  const data = await gql(ACTIVE_DELIVERY_QUERY);
  return data.myActiveDelivery ?? null;
}

export function useActiveDelivery(pendingOffer: Offer | null) {
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);

  useEffect(() => {
    fetchActiveDelivery().then(setActiveDelivery).catch(console.error);
  }, [pendingOffer]);

  async function confirmPickup() {
    if (!activeDelivery) return;
    await gql(CONFIRM_PICKUP_MUTATION, { deliveryId: activeDelivery.id });
    setActiveDelivery(await fetchActiveDelivery());
  }

  async function confirmDelivery() {
    if (!activeDelivery) return;
    await gql(CONFIRM_DELIVERY_MUTATION, { deliveryId: activeDelivery.id });
    setActiveDelivery(null);
  }

  return { activeDelivery, setActiveDelivery, confirmPickup, confirmDelivery };
}
