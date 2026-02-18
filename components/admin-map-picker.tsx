"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { City } from "@/types";
import { useEffect, useRef } from "react";

export function AdminMapPicker({ city, lat, lng, onPick }: { city: City | null; lat: number; lng: number; onPick: (lat: number, lng: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: city ? [city.center_lng, city.center_lat] : [0, 0],
      zoom: city?.default_zoom ?? 10
    });
    map.on("click", (e) => {
      onPick(e.lngLat.lat, e.lngLat.lng);
    });
    mapRef.current = map;
    return () => map.remove();
  }, [city, onPick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lat || !lng) return;
    markerRef.current?.remove();
    markerRef.current = new mapboxgl.Marker({ color: "#b89a5b" }).setLngLat([lng, lat]).addTo(map);
  }, [lat, lng]);

  return <div ref={ref} className="h-48 rounded-xl border border-white/15" />;
}
