"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCities, fetchPlaces } from "@/lib/api";
import { Category, City, Place } from "@/types";
import { CitySelect } from "@/components/city-select";
import { FilterChips } from "@/components/filter-chips";
import { ShabbatControls } from "@/components/shabbat-controls";
import { PlaceCard } from "@/components/place-card";
import { haversineKm } from "@/lib/utils";
import { toast } from "sonner";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), { ssr: false });

export default function MapPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState(params.get("city") ?? "");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [shabbatMode, setShabbatMode] = useState(false);
  const [radius, setRadius] = useState(1.2);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [pickMode, setPickMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();

  useEffect(() => {
    fetchCities().then(setCities).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    if (!cityId) {
      router.replace("/");
      return;
    }
    fetchPlaces(cityId, selectedCategories).then(setPlaces).catch((e) => toast.error(e.message));
  }, [cityId, selectedCategories, router]);

  const city = cities.find((c) => c.id === cityId);

  const enriched = useMemo(() => {
    return places
      .map((place) => ({ ...place, distance: origin ? haversineKm(origin.lat, origin.lng, place.lat, place.lng) : undefined }))
      .filter((p) => !shabbatMode || !origin || (p.distance ?? Infinity) <= radius)
      .sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        if ((a.featured_rank ?? 9999) !== (b.featured_rank ?? 9999)) return (a.featured_rank ?? 9999) - (b.featured_rank ?? 9999);
        if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [places, origin, shabbatMode, radius]);

  return (
    <main className="h-screen p-4 md:p-6">
      <div className="mb-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
        <CitySelect cities={cities} value={cityId} onChange={(id) => { setCityId(id); router.replace(`/map?city=${id}`); }} />
        <FilterChips
          selected={selectedCategories}
          toggle={(c) => setSelectedCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))}
        />
        <ShabbatControls
          enabled={shabbatMode}
          setEnabled={setShabbatMode}
          radius={radius}
          setRadius={setRadius}
          setOriginMode={() => setPickMode(true)}
          useCenter={() => city && setOrigin({ lat: city.center_lat, lng: city.center_lng })}
        />
      </div>

      <section className="grid h-[calc(100%-11rem)] grid-cols-1 gap-4 md:grid-cols-[420px_1fr]">
        <div className="space-y-3 overflow-y-auto pr-1">
          {enriched.length === 0 && <div className="glass rounded-2xl p-5 text-sm text-white/70">No places found.</div>}
          {enriched.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              distance={shabbatMode && origin ? p.distance : undefined}
              active={selectedId === p.id}
              onHover={() => setSelectedId(p.id)}
              origin={origin}
            />
          ))}
        </div>
        <MapView
          places={enriched}
          cityCenter={city ? [city.center_lng, city.center_lat] : [0, 0]}
          zoom={city?.default_zoom ?? 12}
          selectedPlaceId={selectedId}
          onPinClick={setSelectedId}
          origin={origin}
          onSetOrigin={(o) => {
            setOrigin(o);
            setPickMode(false);
          }}
          pickMode={pickMode}
          radiusKm={radius}
        />
      </section>
    </main>
  );
}
