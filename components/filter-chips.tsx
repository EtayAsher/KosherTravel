"use client";

import { categoryOptions } from "@/lib/constants";
import { Category } from "@/types";

export function FilterChips({ selected, toggle }: { selected: Category[]; toggle: (c: Category) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categoryOptions.map((c) => {
        const active = selected.includes(c.value);
        return (
          <button
            key={c.value}
            onClick={() => toggle(c.value)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              active ? "border-white/60 bg-white/20" : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
