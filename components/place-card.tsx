import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Place } from "@/types";

export function PlaceCard({
  place,
  distance,
  active,
  onHover,
  origin
}: {
  place: Place;
  distance?: number;
  active?: boolean;
  onHover?: () => void;
  origin?: { lat: number; lng: number } | null;
}) {
  const directionUrl = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${encodeURIComponent(place.address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;

  return (
    <article
      onMouseEnter={onHover}
      className={`glass rounded-2xl p-4 shadow-premium transition ${active ? "border-gold/80" : "border-white/15"}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{place.name}</h3>
        <div className="flex gap-1">
          {place.is_verified && <Badge className="border-cyan-400/40 bg-cyan-500/20 text-cyan-200">Verified</Badge>}
          {place.is_featured && <Badge className="border-gold/50 bg-gold/20 text-gold">Featured</Badge>}
        </div>
      </div>
      <p className="text-sm text-white/80 capitalize">{place.category}</p>
      <p className="mt-1 text-sm text-white/70">{place.address}</p>
      {distance !== undefined && <p className="mt-2 text-sm text-white/90">{distance.toFixed(1)} km walk</p>}
      <a href={directionUrl} target="_blank" rel="noreferrer">
        <Button className="mt-3 w-full">Directions</Button>
      </a>
    </article>
  );
}
