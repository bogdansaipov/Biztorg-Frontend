/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
}: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let map: any;

    const initMap = async () => {
      if (mapRef.current) return;

      const L = await import("leaflet");

      // Fix default marker icons
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const defaultLat = latitude ?? 41.3111;
      const defaultLng = longitude ?? 69.2797;

      map = L.map("map-picker").setView(
        [defaultLat, defaultLng],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng]).addTo(map);

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id="map-picker"
      className="w-full h-[400px] rounded-xl overflow-hidden"
    />
  );
}