# KosherTravel (MVP V1)

Premium kosher essentials finder with city-based discovery, map view, Shabbat walkable radius planning, and admin-only CMS.

## Stack
- Next.js App Router + TypeScript
- TailwindCSS (premium dark UI)
- Supabase (Postgres + Auth + RLS)
- Mapbox GL JS

## Environment
Create `.env.local`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # for seed script only
```

## Setup
1. Create a Supabase project.
2. Run SQL migration in `supabase/migrations/001_init.sql` in Supabase SQL editor.
3. In Supabase Auth, create your admin user (email/password).
4. Confirm RLS policies were created from migration.
5. Install deps and seed:
   ```bash
   npm install
   npm run seed
   ```
6. Add a Mapbox public token.
7. Run locally:
   ```bash
   npm run dev
   ```
8. Deploy frontend to Vercel and set same env vars.

## Routes
- `/` Home (city select + recent city memory)
- `/map` Finder map/list with filters + Shabbat Mode
- `/admin/login` Admin authentication
- `/admin` Protected admin CRUD

## Admin verification workflow
All seeded places are placeholders with `is_verified=false`. Use `/admin` to:
1. Edit place details with accurate name/address/lat/lng.
2. Toggle `is_verified=true` when checked.
3. Keep `status=published` to display publicly.
4. Set `featured` and `featured_rank` for priority ordering.

## Notes
- Public app only shows `published` places.
- If no places match filters/radius, UI shows “No places found”.
