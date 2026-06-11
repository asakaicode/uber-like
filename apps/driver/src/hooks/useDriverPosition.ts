import { useCallback, useEffect, useRef, useState } from "react";
import { gql } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

const UPDATE_LOCATION_MUTATION = graphql(`
  mutation UpdateDriverLocation($lat: Float!, $lng: Float!, $heading: Float) {
    updateDriverLocation(lat: $lat, lng: $lng, heading: $heading) {
      id
    }
  }
`);

export function useDriverPosition(isOnline: boolean) {
  const [position, setPosition] = useState<[number, number]>([35.6812, 139.7671]);
  const [heading, setHeading] = useState(0);
  const headingRef = useRef(0);

  const updateLocation = useCallback(
    async (lat: number, lng: number, h: number) => {
      setPosition([lat, lng]);
      setHeading(h);
      headingRef.current = h;
      if (isOnline) {
        await gql(UPDATE_LOCATION_MUTATION, { lat, lng, heading: h }).catch(console.error);
      }
    },
    [isOnline],
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const h = pos.coords.heading ?? headingRef.current;
        updateLocation(pos.coords.latitude, pos.coords.longitude, h);
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation]);

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.alpha != null) {
        setHeading(e.alpha);
        headingRef.current = e.alpha;
      }
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  return { position, heading };
}
