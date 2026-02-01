"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface Props {
  latitude: number;
  longitude: number;
}

export default function ProductMap({ latitude, longitude }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (mapInitialized.current) return;
    if (!latitude || !longitude) return;
    if (!mapRef.current) return;

    (async () => {
      const L = await import("leaflet");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView(
        [latitude, longitude],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      L.marker([latitude, longitude]).addTo(map);

      mapInitialized.current = true;
    })();
  }, [latitude, longitude]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] rounded-xl overflow-hidden"
    />
  );
}