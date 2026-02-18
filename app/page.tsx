"use client";

import { CitySelect } from "@/components/city-select";
import { Button } from "@/components/ui/button";
import { fetchCities } from "@/lib/api";
import { City } from "@/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function HomePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCities().then(setCities).catch((e) => toast.error(e.message));
    const recent = localStorage.getItem("recentCityId");
    if (recent) setCityId(recent);
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-20">
      <section className="glass rounded-3xl p-8 shadow-premium">
        <h1 className="text-4xl font-semibold">KosherTravel</h1>
        <p className="mt-4 text-lg text-white/80">Find verified kosher essentials &amp; plan walkable Shabbat areas — fast.</p>
        <div className="mt-8 max-w-md">
          <CitySelect cities={cities} value={cityId} onChange={setCityId} />
          <Button
            className="mt-4 w-full bg-gold/70 text-black hover:bg-gold"
            onClick={() => {
              if (!cityId) return;
              localStorage.setItem("recentCityId", cityId);
              router.push(`/map?city=${cityId}`);
            }}
          >
            Open Map
          </Button>
        </div>
      </section>
    </main>
  );
}
