create table if not exists public.pokemon_cache (
    name text primary key,
    data jsonb not null,
    source_updated_at timestamptz,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.move_cache (
    name text primary key,
    data jsonb not null,
    source_updated_at timestamptz,
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists pokemon_cache_id_idx on public.pokemon_cache ((data->>'id'));
create index if not exists move_cache_id_idx on public.move_cache ((data->>'id'));

alter table public.pokemon_cache enable row level security;
alter table public.move_cache enable row level security;

drop policy if exists "Public can read cached Pokemon" on public.pokemon_cache;
create policy "Public can read cached Pokemon"
    on public.pokemon_cache for select using (true);

drop policy if exists "Public can read cached moves" on public.move_cache;
create policy "Public can read cached moves"
    on public.move_cache for select using (true);