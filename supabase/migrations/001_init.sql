create extension if not exists "pgcrypto";

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  country text,
  center_lat numeric not null,
  center_lng numeric not null,
  default_zoom integer not null default 12,
  created_at timestamp with time zone default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  category text not null check (category in ('chabad','restaurant','grocery','mikveh')),
  address text not null,
  phone text,
  website text,
  lat numeric not null,
  lng numeric not null,
  is_verified boolean not null default false,
  verified_at timestamp with time zone,
  is_featured boolean not null default false,
  featured_rank integer,
  status text not null default 'published' check (status in ('draft','published','hidden')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(city_id, name)
);

create index if not exists places_city_id_idx on public.places(city_id);
create index if not exists places_category_idx on public.places(category);
create index if not exists places_status_idx on public.places(status);
create index if not exists places_featured_rank_idx on public.places(is_featured, featured_rank);

alter table public.cities enable row level security;
alter table public.places enable row level security;

create policy "Public read cities" on public.cities for select using (true);
create policy "Public read published places" on public.places for select using (status = 'published');
create policy "Admin full access cities" on public.cities for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin full access places" on public.places for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
