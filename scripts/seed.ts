import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const cities = [
  ["London", "UK", 51.5074, -0.1278, 11],
  ["New York", "USA", 40.7128, -74.006, 11],
  ["Berlin", "Germany", 52.52, 13.405, 11],
  ["Athens", "Greece", 37.9838, 23.7275, 12],
  ["Los Angeles", "USA", 34.0522, -118.2437, 10],
  ["Miami", "USA", 25.7617, -80.1918, 11],
  ["Rome", "Italy", 41.9028, 12.4964, 11],
  ["Paris", "France", 48.8566, 2.3522, 11]
] as const;

const categories = ["chabad", "restaurant", "grocery", "mikveh"] as const;

function jitter(base: number) {
  return base + (Math.random() - 0.5) * 0.08;
}

async function run() {
  const { data: insertedCities, error: cityError } = await supabase
    .from("cities")
    .upsert(cities.map((c) => ({ name: c[0], country: c[1], center_lat: c[2], center_lng: c[3], default_zoom: c[4] })), { onConflict: "name" })
    .select();

  if (cityError) throw cityError;

  const places = insertedCities.flatMap((city) =>
    Array.from({ length: 10 }).map((_, i) => ({
      city_id: city.id,
      name: `${city.name} Kosher ${i + 1}`,
      category: categories[i % categories.length],
      address: `${100 + i} ${city.name} Central Ave`,
      phone: `+1-555-01${String(i).padStart(2, "0")}`,
      website: `https://example.com/${city.name.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`,
      lat: jitter(Number(city.center_lat)),
      lng: jitter(Number(city.center_lng)),
      is_verified: false,
      is_featured: i < 2,
      featured_rank: i < 2 ? i + 1 : null,
      status: "published"
    }))
  );

  const { error: placeError } = await supabase.from("places").upsert(places, { onConflict: "city_id,name" });
  if (placeError) throw placeError;

  console.log(`Seeded ${insertedCities.length} cities and ${places.length} places.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
