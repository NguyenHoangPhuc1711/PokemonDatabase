create table if not exists public.teams (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null default 'My Team',
    pokemon_json jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trainer_cards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    name text,
    slug text not null unique,
    card_data_json jsonb not null default '{}'::jsonb,
    image_url text,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.news_items (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    summary text not null default '',
    tag text not null default 'News',
    source_name text not null default '',
    source_url text not null default '',
    published_at timestamptz not null default timezone('utc', now()),
    is_published boolean not null default false
);

insert into storage.buckets (id, name, public)
values ('trainer-cards', 'trainer-cards', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view trainer card images" on storage.objects;
create policy "Public can view trainer card images"
    on storage.objects for select using (bucket_id = 'trainer-cards');

alter table public.teams enable row level security;
alter table public.trainer_cards enable row level security;
alter table public.news_items enable row level security;

drop policy if exists "Users can read own teams" on public.teams;
create policy "Users can read own teams" on public.teams for select using (auth.uid() = user_id);
drop policy if exists "Users can create own teams" on public.teams;
create policy "Users can create own teams" on public.teams for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own teams" on public.teams;
create policy "Users can update own teams" on public.teams for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own teams" on public.teams;
create policy "Users can delete own teams" on public.teams for delete using (auth.uid() = user_id);

drop policy if exists "Public can read trainer cards" on public.trainer_cards;
create policy "Public can read trainer cards" on public.trainer_cards for select using (true);
drop policy if exists "Users can create trainer cards" on public.trainer_cards;
create policy "Users can create trainer cards" on public.trainer_cards for insert with check (user_id is null or auth.uid() = user_id);
drop policy if exists "Owners can update trainer cards" on public.trainer_cards;
create policy "Owners can update trainer cards" on public.trainer_cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Owners can delete trainer cards" on public.trainer_cards;
create policy "Owners can delete trainer cards" on public.trainer_cards for delete using (auth.uid() = user_id);

drop policy if exists "Public can read published news" on public.news_items;
create policy "Public can read published news" on public.news_items for select using (is_published = true);