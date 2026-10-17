-- Phase 2: home page content (R13, R14), trust badges (R11), testimonials and
-- results (R19). Phase 3 adds proof tags (service/niche/country) to these.

-- ------------------------------------------------------------ page content
-- Structured page content as JSONB, checked by Zod schemas in code
-- (src/content/*-schema.ts). Phase 2 stores the home page under key 'home';
-- Phase 3 moves pages into the full pages/page_versions model.
create table public.page_content (
  key        text primary key check (key ~ '^[a-z0-9-]+$'),
  data       jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create trigger page_content_touch before update on public.page_content
  for each row execute function public.touch_updated_at();

alter table public.page_content enable row level security;

create policy "page_content: public read" on public.page_content
  for select to anon, authenticated using (true);
create policy "page_content: staff write" on public.page_content
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

grant select on public.page_content to anon, authenticated;
grant insert, update on public.page_content to authenticated;

-- ------------------------------------------------------------------ badges
-- A badge can only be switched on once it has a proof URL (R11).
create table public.badges (
  id               uuid primary key default gen_random_uuid(),
  label            text not null check (char_length(label) between 1 and 80),
  sublabel         text check (char_length(sublabel) <= 80),
  image_public_id  text check (image_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  proof_url        text check (proof_url ~ '^https://'),
  last_verified_at date,
  enabled          boolean not null default false,
  sort             integer not null default 0,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint badges_enabled_needs_proof check (not enabled or proof_url is not null)
);

create trigger badges_touch before update on public.badges
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------ testimonials
-- Shown only when approved (the person agreed to be quoted) and not a placeholder.
create table public.testimonials (
  id              uuid primary key default gen_random_uuid(),
  quote           text not null check (char_length(quote) between 1 and 1200),
  person_name     text not null check (char_length(person_name) <= 80),
  person_role     text check (char_length(person_role) <= 120),
  company         text check (char_length(company) <= 120),
  photo_public_id text check (photo_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  approved        boolean not null default false,
  is_placeholder  boolean not null default false,
  sort            integer not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint testimonials_placeholder_not_approved check (not (approved and is_placeholder))
);

create trigger testimonials_touch before update on public.testimonials
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------- results
-- Proof blocks (R19): brand, logo, metric, screenshot. A placeholder keeps
-- its slot in admin but never renders on the live site.
create table public.results (
  id                 uuid primary key default gen_random_uuid(),
  brand_name         text not null check (char_length(brand_name) <= 80),
  logo_public_id     text check (logo_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  metric_value       text not null check (char_length(metric_value) <= 40),
  metric_label       text not null check (char_length(metric_label) <= 120),
  summary            text check (char_length(summary) <= 400),
  image_public_id    text check (image_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  image_alt          text check (char_length(image_alt) <= 200),
  approved           boolean not null default false,
  is_placeholder     boolean not null default true,
  sort               integer not null default 0,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint results_placeholder_not_approved check (not (approved and is_placeholder)),
  constraint results_approved_needs_image check (not approved or (image_public_id is not null and image_alt is not null))
);

create trigger results_touch before update on public.results
  for each row execute function public.touch_updated_at();

-- -------------------------------------------- RLS for badges/testimonials/results
-- The public sees only items that may go live; staff see and edit everything;
-- only owner/developer can delete.
alter table public.badges enable row level security;
alter table public.testimonials enable row level security;
alter table public.results enable row level security;

create policy "badges: public reads live" on public.badges
  for select to anon using (enabled);
create policy "badges: staff read" on public.badges
  for select to authenticated using ((select public.is_staff()) or enabled);
create policy "badges: staff write" on public.badges
  for insert to authenticated with check ((select public.is_staff()));
create policy "badges: staff update" on public.badges
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "badges: managers delete" on public.badges
  for delete to authenticated using ((select public.can_manage()));

create policy "testimonials: public reads live" on public.testimonials
  for select to anon using (approved and not is_placeholder);
create policy "testimonials: staff read" on public.testimonials
  for select to authenticated using ((select public.is_staff()) or (approved and not is_placeholder));
create policy "testimonials: staff write" on public.testimonials
  for insert to authenticated with check ((select public.is_staff()));
create policy "testimonials: staff update" on public.testimonials
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "testimonials: managers delete" on public.testimonials
  for delete to authenticated using ((select public.can_manage()));

create policy "results: public reads live" on public.results
  for select to anon using (approved and not is_placeholder);
create policy "results: staff read" on public.results
  for select to authenticated using ((select public.is_staff()) or (approved and not is_placeholder));
create policy "results: staff write" on public.results
  for insert to authenticated with check ((select public.is_staff()));
create policy "results: staff update" on public.results
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "results: managers delete" on public.results
  for delete to authenticated using ((select public.can_manage()));

grant select on public.badges, public.testimonials, public.results to anon, authenticated;
grant insert, update, delete on public.badges, public.testimonials, public.results to authenticated;

-- ------------------------------------------------------------------- seed
-- From the live site (docs/content/wordpress-inventory.md). Everything starts
-- switched off / unapproved: nothing goes live without proof and permission.
-- Badge artwork is white on transparent; the site darkens it in light mode.
insert into public.badges (label, sublabel, sort, notes) values
  ('Google Partner', 'Premier Partner (to confirm)', 10, 'Live site shows both "Google Partner" and "Google Premier Partner". Needs the Google Partners directory link.'),
  ('Meta Business Partner', null, 20, 'Needs the Meta partner directory link.'),
  ('YouTube Certified', null, 30, 'Needs a certificate link.'),
  ('Microsoft Advertising', 'Select Partner', 40, 'Needs the Microsoft partner directory link.'),
  ('Indian Government Award', 'Best Social Media Content', 50, 'Andhra Pradesh Government award. Needs an article or photo link.'),
  ('2B+', 'Conversions or views? (to confirm)', 60, 'Conflict: home page says 2 Billion conversions, About says 2B views, the brief says 2,000,000+ conversions.');

update public.badges set image_public_id = 'rohtre-media/images/badges/google-premier-partner' where label = 'Google Partner';
update public.badges set image_public_id = 'rohtre-media/images/badges/meta-business-partner' where label = 'Meta Business Partner';
update public.badges set image_public_id = 'rohtre-media/images/badges/youtube-icon-white' where label = 'YouTube Certified';
update public.badges set image_public_id = 'rohtre-media/images/badges/microsoft-advertising-select-partner' where label = 'Microsoft Advertising';

insert into public.testimonials (quote, person_name, person_role, company, sort, notes) values
  ('I always thought taking my offline business online would be complicated and risky. RohTre Media made it simple. Their team studied my products, built a professional online store, and even handled all the design and promotions. Today, I''m not just selling from my godown, I''m reaching customers across India.', 'NealGuides', null, null, 10, 'From the live site. Confirm it is a real client and that they agreed to be quoted.'),
  ('RohTre Media delivered incredible content for me. The quality, creativity and execution were world-class. This is the kind of work that makes you want to collaborate again and again.', 'KSI', null, 'Sidemen', 20, 'From the live site. Confirm permission.'),
  ('RohTre Media helped us massively in the early stages of our business. They sorted everything: Google marketing, Facebook marketing, email marketing, our website, design and social media. They were a one-stop solution for all our marketing needs.', 'Rumman Ali', 'CEO', 'Harmiche.com', 30, 'From the live site. Confirm permission.'),
  ('RohTre Media manages our entire content pipeline, and their data-driven insights on imagery and creatives have doubled our business. Their conversion strategies are driving major sales on our merchandise site.', 'Pedram', 'CEO', 'PedTalkSports', 40, 'From the live site ("doubled our business" is a claim to confirm). Confirm permission.'),
  ('They put this video together so quickly, and I absolutely loved the Diwali segment. It was perfect from start to finish, with no changes needed.', 'Charlotte Marsh', 'Engagement Manager, ANZ & Emerging Markets', 'EA Sports Australia', 50, 'From the live site. Confirm permission.');

insert into public.results (brand_name, metric_value, metric_label, summary, sort, notes) values
  ('Brand name', '+000%', 'Metric to confirm', 'One line on what we did and the result.', 10, 'PLACEHOLDER: add a real client, metric and dashboard screenshot.'),
  ('Brand name', '0.0x', 'Metric to confirm', 'One line on what we did and the result.', 20, 'PLACEHOLDER: add a real client, metric and dashboard screenshot.'),
  ('Brand name', '₹00 L', 'Metric to confirm', 'One line on what we did and the result.', 30, 'PLACEHOLDER: add a real client, metric and dashboard screenshot.');
