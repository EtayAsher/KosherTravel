"use client";

import { Input } from "@/components/ui/input";
import { City } from "@/types";
import { useMemo, useState } from "react";

type Props = {
  cities: City[];
  value?: string;
  onChange: (cityId: string) => void;
};

export function CitySelect({ cities, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => cities.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [cities, query]
  );

  return (
    <div className="space-y-2">
      <Input placeholder="Search city" value={query} onChange={(e) => setQuery(e.target.value)} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2"
      >
        <option value="">Select a city</option>
        {filtered.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
