"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Place } from "@/types";
import { useEffect, useRef } from "react";

type Props = {
  places: Place[];
  cityCenter: [number, number];
  zoom: number;
  selectedPlaceId?: string;
  onPinClick: (id: string) => void;
  origin: { lat: number; lng: number } | null;
  onSetOrigin: (origin: { lat: number; lng: number }) => void;
  pickMode: boolean;
  radiusKm: number;
};

export function MapView({ places, cityCenter, zoom, selectedPlaceId, onPinClick, origin, onSetOrigin, pickMode, radiusKm }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!containerRef.current || mapRef.current) return;
    if (!token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: cityCenter,
      zoom
    });
    mapRef.current = map;

    map.on("click", (e) => {
      if (pickMode) onSetOrigin({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => map.remove();
  }, [cityCenter, zoom, onSetOrigin, pickMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = places.map((place) => {
      const color = place.category === "chabad" ? "#4fd1c5" : place.category === "restaurant" ? "#b89a5b" : place.category === "grocery" ? "#5a8dee" : "#9f7aea";
      const marker = new mapboxgl.Marker({ color, scale: selectedPlaceId === place.id ? 1.2 : 0.9 })
        .setLngLat([place.lng, place.lat])
        .addTo(map);
      marker.getElement().addEventListener("click", () => onPinClick(place.id));
      return marker;
    });
  }, [places, selectedPlaceId, onPinClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    originMarkerRef.current?.remove();
    if (origin) {
      originMarkerRef.current = new mapboxgl.Marker({ color: "#ffffff" }).setLngLat([origin.lng, origin.lat]).addTo(map);
      const circleId = "radius-circle";
      if (map.getSource(circleId)) {
        map.removeLayer(circleId);
        map.removeSource(circleId);
      }
      const points: [number, number][] = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * 2 * Math.PI;
        const dx = (radiusKm / 111.32) * Math.cos(angle);
        const dy = (radiusKm / (111.32 * Math.cos((origin.lat * Math.PI) / 180))) * Math.sin(angle);
        points.push([origin.lng + dy, origin.lat + dx]);
      }
      map.addSource(circleId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [points] },
          properties: {}
        }
      });
      map.addLayer({
        id: circleId,
        type: "fill",
        source: circleId,
        paint: { "fill-color": "#b89a5b", "fill-opacity": 0.15 }
      });
    }
  }, [origin, radiusKm]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return <div className="flex h-full items-center justify-center rounded-2xl border border-white/15">Missing NEXT_PUBLIC_MAPBOX_TOKEN</div>;
  }

  return <div ref={containerRef} className="h-full min-h-[360px] rounded-2xl" />;
}
