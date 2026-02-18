# KosherTravel — Static Finder + Shabbat Planner

A GitHub Pages-ready static app for discovering kosher places with a premium light map UI and a dedicated Shabbat planning experience.

## Experience structure

- `index.html`: single-page finder (city selector + filters + map + results together).
- `shabbat.html`: dedicated Shabbat planner with hotel origin + walkable radius.
- `admin.html`: local static CMS for overrides (import/export JSON + localStorage save).

## Features

- Single-page finder flow (no map page jump).
- Light premium map style (Carto Positron via Leaflet).
- City persistence in `localStorage` (`koshertravel_city`).
- Filter chips by category.
- Sorting: Featured (ranked), then Verified, then name.
- Website button only shown when URL is valid and non-placeholder.
- Shabbat planner with:
  - Set hotel location (map click)
  - Radius slider (default 1.2 km)
  - Walkable-only filtering + distances
  - Export list to clipboard
- Admin URL validation:
  - Auto-prefixes `https://` when missing
  - Rejects `example.*`, `localhost`, invalid schemes
  - Saves invalid entries as empty website string

## Data + storage

- `data/cities.json`: city definitions.
- `data/places.json`: base places dataset.
- Local override key: `koshertravel_places_override`.
- Active dataset = `places.json` merged with local override (when present).

## Local run

```bash
python3 -m http.server 8000
```

Open:

- Finder: `http://localhost:8000/index.html`
- Shabbat: `http://localhost:8000/shabbat.html`
- Admin: `http://localhost:8000/admin.html`

## Deploy

No build step required. Publish directly to GitHub Pages.
