-- Phase 3: landing system (R1-R7, R15-R21, R24 versions, R25, R28, R42, R45).

-- ------------------------------------------------------------- dimensions
-- A landing page is a combination of dimension values (service x niche x
-- country). A new dimension is a row in dimension_types, not a rewrite (R1).
create table public.dimension_types (
  key   text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  label text not null,
  sort  integer not null default 0
);

create table public.dimension_values (
  id             uuid primary key default gen_random_uuid(),
  type_key       text not null references public.dimension_types (key) on update cascade,
  parent_id      uuid references public.dimension_values (id) on delete restrict, -- hierarchy (R2, R6)
  slug           text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label          text not null check (char_length(label) between 1 and 80),
  headline_label text not null check (char_length(headline_label) between 1 and 80), -- as used in "Meta Ads for Fashion Brands in the USA"
  attrs          jsonb not null default '{}'::jsonb check (jsonb_typeof(attrs) = 'object'), -- checked by Zod in code
  sort           integer not null default 0,
  active         boolean not null default true,
  unique (type_key, slug)
);

create index dimension_values_parent_idx on public.dimension_values (parent_id);

-- ------------------------------------------------------------------ pages
create type public.page_visibility as enum ('public', 'unlisted', 'private');
create type public.page_status as enum ('draft', 'published', 'archived');

create table public.pages (
  id                   uuid primary key default gen_random_uuid(),
  kind                 text not null default 'landing' check (kind in ('landing')),
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  slug_auto            boolean not null default true,     -- regenerate the slug from the dimensions until edited by hand
  headline_auto        boolean not null default true,     -- same for the H1 (R4)
  visibility           public.page_visibility not null default 'unlisted', -- R42: landing pages unlisted by default
  status               public.page_status not null default 'draft',
  draft_version_id     uuid,
  published_version_id uuid,
  published_at         timestamptz,
  published_by         uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint pages_published_needs_version check (status <> 'published' or published_version_id is not null)
);

create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

create table public.page_versions (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages (id) on delete cascade,
  number     integer not null,
  -- The page content, checked by the section registry (src/sections) on
  -- every save: { meta: {title, description}, sections: [{id, type, variant, enabled, props}] }
  content    jsonb not null check (jsonb_typeof(content) = 'object'),
  note       text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (page_id, number)
);

alter table public.pages
  add constraint pages_draft_version_fk foreign key (draft_version_id) references public.page_versions (id) on delete set null,
  add constraint pages_published_version_fk foreign key (published_version_id) references public.page_versions (id) on delete restrict;

create table public.page_dimensions (
  page_id  uuid not null references public.pages (id) on delete cascade,
  type_key text not null references public.dimension_types (key) on update cascade,
  value_id uuid not null references public.dimension_values (id) on delete restrict,
  primary key (page_id, type_key)
);

-- -------------------------------------------------------------- redirects
-- A slug change adds a 301 automatically (R3); chains are collapsed.
create table public.redirects (
  from_path  text primary key check (from_path ~ '^/'),
  to_path    text not null check (to_path ~ '^/'),
  status     integer not null default 301 check (status in (301, 308)),
  auto       boolean not null default false,
  created_at timestamptz not null default now(),
  constraint redirects_not_self check (from_path <> to_path)
);

create or replace function public.pages_slug_redirect()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_path text := '/lp/' || old.slug;
  new_path text := '/lp/' || new.slug;
begin
  if new.slug is distinct from old.slug then
    -- Anything that pointed at the old address now points at the new one.
    update public.redirects set to_path = new_path where to_path = old_path;
    -- The new address must not redirect anywhere.
    delete from public.redirects where from_path = new_path;
    insert into public.redirects (from_path, to_path, auto)
    values (old_path, new_path, true)
    on conflict (from_path) do update set to_path = excluded.to_path, auto = true;
  end if;
  return new;
end
$$;

create trigger pages_slug_redirect after update of slug on public.pages
  for each row execute function public.pages_slug_redirect();

-- ------------------------------------------------- creatives and concept work
-- Real client work (R20) and concept work (R45) are separate tables, so they
-- can't be mixed by accident. Concept work has no client, no metric, and
-- always shows its label.
create table public.creatives (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null check (kind in ('image', 'reel')),
  brand_name       text not null check (char_length(brand_name) <= 80),
  media_public_id  text check (media_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  poster_public_id text check (poster_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  alt              text check (char_length(alt) <= 200),
  approved         boolean not null default false,
  is_placeholder   boolean not null default true,
  sort             integer not null default 0,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint creatives_placeholder_not_approved check (not (approved and is_placeholder)),
  constraint creatives_approved_needs_media check (not approved or (media_public_id is not null and alt is not null)),
  constraint creatives_reel_needs_poster check (kind <> 'reel' or not approved or poster_public_id is not null)
);

create table public.concept_works (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null check (kind in ('image', 'reel')),
  media_public_id  text check (media_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  poster_public_id text check (poster_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  alt              text check (char_length(alt) <= 200),
  label_text       text not null default 'Concept work - not a client project' check (char_length(label_text) between 5 and 80),
  approved         boolean not null default false,
  sort             integer not null default 0,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint concept_approved_needs_media check (not approved or (media_public_id is not null and alt is not null))
);

create trigger creatives_touch before update on public.creatives for each row execute function public.touch_updated_at();
create trigger concept_works_touch before update on public.concept_works for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------- proof tags
-- Proof is tagged by dimension value (R18). A page shows the proof whose tags
-- match it (matching rules in src/lib/proof-match.ts).
create table public.proof_tags (
  item_type text not null check (item_type in ('result', 'testimonial', 'creative', 'concept_work')),
  item_id   uuid not null,
  value_id  uuid not null references public.dimension_values (id) on delete cascade,
  primary key (item_type, item_id, value_id)
);

-- ----------------------------------------------------------------- RLS
alter table public.dimension_types enable row level security;
alter table public.dimension_values enable row level security;
alter table public.pages enable row level security;
alter table public.page_versions enable row level security;
alter table public.page_dimensions enable row level security;
alter table public.redirects enable row level security;
alter table public.creatives enable row level security;
alter table public.concept_works enable row level security;
alter table public.proof_tags enable row level security;

-- Dimensions, tags and redirects are not secret: anyone may read them.
create policy "dimension_types: read" on public.dimension_types for select to anon, authenticated using (true);
create policy "dimension_values: read" on public.dimension_values for select to anon, authenticated using (true);
create policy "proof_tags: read" on public.proof_tags for select to anon, authenticated using (true);
create policy "redirects: read" on public.redirects for select to anon, authenticated using (true);

-- The public sees published public/unlisted pages and only their published version.
create policy "pages: public reads published" on public.pages for select to anon
  using (status = 'published' and visibility in ('public', 'unlisted'));
create policy "pages: staff read" on public.pages for select to authenticated
  using ((select public.is_staff()) or (status = 'published' and visibility in ('public', 'unlisted')));
create policy "page_versions: public reads published" on public.page_versions for select to anon
  using (exists (
    select 1 from public.pages p
    where p.published_version_id = page_versions.id and p.status = 'published' and p.visibility in ('public', 'unlisted')
  ));
create policy "page_versions: staff read" on public.page_versions for select to authenticated
  using ((select public.is_staff()) or exists (
    select 1 from public.pages p
    where p.published_version_id = page_versions.id and p.status = 'published' and p.visibility in ('public', 'unlisted')
  ));
create policy "page_dimensions: read" on public.page_dimensions for select to anon, authenticated using (true);

create policy "creatives: public reads live" on public.creatives for select to anon using (approved and not is_placeholder);
create policy "creatives: staff read" on public.creatives for select to authenticated
  using ((select public.is_staff()) or (approved and not is_placeholder));
create policy "concept_works: public reads live" on public.concept_works for select to anon using (approved);
create policy "concept_works: staff read" on public.concept_works for select to authenticated
  using ((select public.is_staff()) or approved);

-- Staff edit drafts and content; publishing, visibility, redirects and
-- deletes are for owner/developer (publish runs through publish_page()).
create policy "dimension_values: managers write" on public.dimension_values for all to authenticated
  using ((select public.can_manage())) with check ((select public.can_manage()));
create policy "pages: staff insert drafts" on public.pages for insert to authenticated
  with check ((select public.is_staff()) and status = 'draft');
create policy "pages: staff update" on public.pages for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "pages: managers delete" on public.pages for delete to authenticated using ((select public.can_manage()));
create policy "page_versions: staff insert" on public.page_versions for insert to authenticated with check ((select public.is_staff()));
create policy "page_dimensions: staff write" on public.page_dimensions for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "redirects: managers write" on public.redirects for all to authenticated
  using ((select public.can_manage())) with check ((select public.can_manage()));
create policy "creatives: staff write" on public.creatives for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "concept_works: staff write" on public.concept_works for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "proof_tags: staff write" on public.proof_tags for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Editors may change content but not publish or change visibility (R24).
create or replace function public.pages_guard_editor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'authenticated' and not (select public.can_manage()) then
    if new.status is distinct from old.status
      or new.published_version_id is distinct from old.published_version_id
      or new.visibility is distinct from old.visibility then
      raise exception 'Only the owner or developer can publish or change visibility';
    end if;
  end if;
  return new;
end
$$;

create trigger pages_guard_editor before update on public.pages
  for each row execute function public.pages_guard_editor();

grant select on public.dimension_types, public.dimension_values, public.pages, public.page_versions,
  public.page_dimensions, public.redirects, public.creatives, public.concept_works, public.proof_tags to anon, authenticated;
grant insert, update, delete on public.dimension_values, public.pages, public.page_dimensions, public.redirects,
  public.creatives, public.concept_works, public.proof_tags to authenticated;
grant insert on public.page_versions to authenticated;
revoke insert, update, delete on public.dimension_types, public.dimension_values, public.pages, public.page_versions,
  public.page_dimensions, public.redirects, public.creatives, public.concept_works, public.proof_tags from anon;

-- ------------------------------------------------------------------ seed
-- Dimensions only: labels from the brief (R2, R6, R7). Country phone numbers
-- come from global settings; currency/locale/time zone are standard values.
insert into public.dimension_types (key, label, sort) values
  ('service', 'Service', 10), ('niche', 'Niche', 20), ('country', 'Country', 30);

insert into public.dimension_values (type_key, slug, label, headline_label, attrs, sort) values
  ('service', 'meta-ads', 'Meta ads', 'Meta Ads', '{"channels": ["meta"]}', 10),
  ('service', 'google-ads', 'Google Ads', 'Google Ads', '{"channels": ["google"]}', 20),
  ('service', 'd2c-marketing', 'D2C marketing', 'D2C Marketing', '{"channels": ["google", "meta"]}', 30),
  ('niche', 'fashion', 'Fashion', 'Fashion', '{}', 10),
  ('country', 'india', 'India', 'India', '{"iso": "IN", "currency": "INR", "locale": "en-IN", "timeZone": "Asia/Kolkata"}', 10),
  ('country', 'usa', 'USA', 'the USA', '{"iso": "US", "currency": "USD", "locale": "en-US", "timeZone": "America/New_York"}', 20),
  ('country', 'uk', 'UK', 'the UK', '{"iso": "GB", "currency": "GBP", "locale": "en-GB", "timeZone": "Europe/London"}', 30),
  ('country', 'australia', 'Australia', 'Australia', '{"iso": "AU", "currency": "AUD", "locale": "en-AU", "timeZone": "Australia/Sydney"}', 40),
  ('country', 'uae', 'UAE', 'the UAE', '{"iso": "AE", "currency": "AED", "locale": "en-AE", "timeZone": "Asia/Dubai"}', 50);

-- R2: D2C marketing (Google + Meta) has a Meta-only and a Google-only child.
insert into public.dimension_values (type_key, parent_id, slug, label, headline_label, attrs, sort)
select 'service', id, v.slug, v.label, v.headline_label, v.attrs::jsonb, v.sort
from public.dimension_values,
  (values ('d2c-meta-ads', 'D2C Meta ads marketing', 'D2C Meta Ads Marketing', '{"channels": ["meta"]}', 31),
          ('d2c-google-ads', 'D2C Google account management', 'D2C Google Account Management', '{"channels": ["google"]}', 32))
    as v (slug, label, headline_label, attrs, sort)
where type_key = 'service' and dimension_values.slug = 'd2c-marketing';

-- R6: fashion sub-niches get their own pages.
insert into public.dimension_values (type_key, parent_id, slug, label, headline_label, sort)
select 'niche', id, v.slug, v.label, v.headline_label, v.sort
from public.dimension_values,
  (values ('clothing', 'Clothing', 'Clothing', 11), ('shoes', 'Shoes', 'Shoe', 12), ('jewellery', 'Jewellery', 'Jewellery', 13))
    as v (slug, label, headline_label, sort)
where type_key = 'niche' and dimension_values.slug = 'fashion';
