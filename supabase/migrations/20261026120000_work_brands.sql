-- Work page brands (2026-10-26).
-- Free: one small table in the existing database.
--
-- work_brands: one row per brand on /work, each with its own page
-- /work/<slug>. The page text, numbers and images live in `data` (JSON,
-- checked by brandSchema in src/content/work-schema.ts on save and on
-- read). The Work and Recognition pages themselves are page_content rows
-- ("work", "recognition"), like the other company pages: no change needed.
--
-- RLS is on. The public (anon) key reads PUBLISHED rows only, so a draft
-- brand is never visible. Staff read and write everything through the
-- admin's server actions (signed in). No public write policy.
--
-- A published brand's slug is locked (its URL is live): to change it, save
-- the brand unpublished first (the old URL then returns 404).
--
-- After applying this, run `npm run seed:work` once to store the ten brands
-- copied from the live site (until then the site shows the same ten).

create table public.work_brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
                check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name        text not null check (char_length(name) between 1 and 60),
  published   boolean not null default false,
  sort_order  integer not null default 0,
  data        jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

create index work_brands_order on public.work_brands (published, sort_order, created_at);

create trigger work_brands_touch before update on public.work_brands
  for each row execute function public.touch_updated_at();

-- The slug of a brand that stays published can't change.
create function public.work_brands_lock_slug() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if old.published and new.published and new.slug <> old.slug then
    raise exception 'A published brand''s slug is locked. Unpublish it first.';
  end if;
  return new;
end;
$$;

create trigger work_brands_lock_slug before update on public.work_brands
  for each row execute function public.work_brands_lock_slug();

alter table public.work_brands enable row level security;

create policy "work_brands: public read published" on public.work_brands
  for select to anon, authenticated using (published);
create policy "work_brands: staff read" on public.work_brands
  for select to authenticated using ((select public.is_staff()));
create policy "work_brands: staff insert" on public.work_brands
  for insert to authenticated with check ((select public.is_staff()));
create policy "work_brands: staff update" on public.work_brands
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "work_brands: staff delete" on public.work_brands
  for delete to authenticated using ((select public.is_staff()));

grant select on public.work_brands to anon, authenticated;
grant insert, update, delete on public.work_brands to authenticated;
