import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Offer } from "../hooks/usePendingOffer";
import type { ActiveDelivery } from "../hooks/useActiveDelivery";

const driverIcon = (heading: number) =>
  L.divIcon({
    className: "",
    html: `<div style="transform:rotate(${heading}deg);font-size:24px">⬆️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

interface DriverMapProps {
  position: [number, number];
  heading: number;
  route: [number, number][];
  pendingOffer: Offer | null;
  activeDelivery: ActiveDelivery | null;
}

export function DriverMap({ position, heading, route, pendingOffer, activeDelivery }: DriverMapProps) {
  return (
    <MapContainer center={position} zoom={14} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapUpdater center={position} />
      <Marker position={position} icon={driverIcon(heading)} />
      {route.length > 0 && <Polyline positions={route} color="#2563eb" weight={4} />}
      {pendingOffer && (
        <>
          <Marker position={[pendingOffer.order.restaurant.lat, pendingOffer.order.restaurant.lng]} />
          <Marker position={[pendingOffer.order.deliveryLat, pendingOffer.order.deliveryLng]} />
        </>
      )}
      {activeDelivery && (
        <>
          <Marker
            position={[activeDelivery.order.restaurant.lat, activeDelivery.order.restaurant.lng]}
          />
          <Marker position={[activeDelivery.order.deliveryLat, activeDelivery.order.deliveryLng]} />
        </>
      )}
    </MapContainer>
  );
}
