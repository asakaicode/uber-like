import { useState } from "react";
import { gql, useSubscription, type ResultOf } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

const OFFER_FIELDS = graphql(`
  fragment OfferFields on DriverOffer {
    id
    status
    expiresAt
    totalDistance
    estimatedMinutes
    reward
    order {
      id
      deliveryLat
      deliveryLng
      restaurant {
        name
        lat
        lng
      }
    }
  }
`);

export const PENDING_OFFERS_QUERY = graphql(`
  query PendingOffers($first: Int, $status: OfferStatus) {
    myOffers(first: $first, status: $status) {
      edges {
        node {
          ...OfferFields
        }
      }
    }
  }
`);

const DRIVER_OFFER_SUBSCRIPTION = graphql(`
  subscription DriverOfferReceived {
    driverOfferReceived {
      ...OfferFields
    }
  }
`);

const RESPOND_TO_OFFER_MUTATION = graphql(`
  mutation RespondToOffer($offerId: ID!, $accept: Boolean!) {
    respondToOffer(offerId: $offerId, accept: $accept) {
      id
      status
    }
  }
`);

export type Offer = ResultOf<typeof OFFER_FIELDS>;

export function usePendingOffer(isOnline: boolean) {
  const [pendingOffer, setPendingOffer] = useState<Offer | null>(null);
  const [responding, setResponding] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  async function loadPendingOffer() {
    const data = await gql(PENDING_OFFERS_QUERY, { first: 1, status: "PENDING" });
    const offer = data.myOffers.edges[0]?.node ?? null;
    if (offer && new Date(offer.expiresAt) > new Date()) {
      setPendingOffer(offer);
    }
  }

  useSubscription(
    DRIVER_OFFER_SUBSCRIPTION,
    {},
    (data) => {
      const offer = data.driverOfferReceived;
      if (offer?.status === "PENDING") setPendingOffer(offer);
    },
    isOnline,
  );

  async function respondToOffer(accept: boolean): Promise<boolean> {
    if (!pendingOffer || responding) return false;
    setResponding(true);
    setOfferError(null);
    try {
      await gql(RESPOND_TO_OFFER_MUTATION, { offerId: pendingOffer.id, accept });
      setPendingOffer(null);
      return accept;
    } catch (err) {
      const message = err instanceof Error ? err.message : "リクエストに失敗しました";
      setOfferError(message);
      if (
        message.includes("expired") ||
        message.includes("already responded") ||
        message.includes("not found")
      ) {
        setPendingOffer(null);
      }
      return false;
    } finally {
      setResponding(false);
    }
  }

  return { pendingOffer, setPendingOffer, responding, offerError, loadPendingOffer, respondToOffer };
}
