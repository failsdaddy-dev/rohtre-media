-- Phase 4: admin (R22-R27): media library, audit log, preview links,
-- ad-group mapping table.

-- ------------------------------------------------------------------ media
-- Every file uploaded through the admin. Deleting it here also deletes it
-- from Cloudinary (founder decision), once nothing on the site uses it.
create table public.media (
  public_id     text primary key check (public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$'),
  resource_type text not null check (resource_type in ('image', 'video')),
  width         integer check (width > 0),
  height        integer check (height > 0),
  bytes         integer check (bytes >= 0),
  format        text,
  alt           text check (char_length(alt) <= 250),
  uploaded_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.media enable row level security;
create policy "media: staff read" on public.media for select to authenticated using ((select public.is_staff()));
create policy "media: staff insert" on public.media for insert to authenticated with check ((select public.is_staff()));
create policy "media: staff update" on public.media for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "media: managers delete" on public.media for delete to authenticated using ((select public.can_manage()));
revoke all on public.media from anon;
grant select, insert, update, delete on public.media to authenticated;

-- -------------------------------------------------------------- audit log
-- Who did what, when (R24). Insert-only: nobody can edit or delete history.
create table public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  actor_id   uuid references auth.users (id) on delete set null,
  actor_email text,
  action     text not null check (char_length(action) <= 60),
  entity     text not null check (char_length(entity) <= 40),
  entity_id  text,
  details    jsonb not null default '{}'::jsonb
);

create index audit_log_at_idx on public.audit_log (at desc);

alter table public.audit_log enable row level security;
create policy "audit: managers read" on public.audit_log for select to authenticated using ((select public.can_manage()));
create policy "audit: staff append" on public.audit_log for insert to authenticated
  with check ((select public.is_staff()) and actor_id = (select auth.uid()));
revoke all on public.audit_log from anon;
revoke update, delete on public.audit_log from authenticated;
grant select, insert on public.audit_log to authenticated;

-- ---------------------------------------------------------- preview links
-- Expiring links to one page version (R24). Only a hash of the token is
-- stored; the link itself is shown once to whoever creates it.
create table public.preview_tokens (
  token_hash text primary key check (char_length(token_hash) = 64),
  page_id    uuid not null references public.pages (id) on delete cascade,
  version_id uuid not null references public.page_versions (id) on delete cascade,
  expires_at timestamptz not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.preview_tokens enable row level security;
create policy "preview: staff read" on public.preview_tokens for select to authenticated using ((select public.is_staff()));
create policy "preview: staff create" on public.preview_tokens for insert to authenticated with check ((select public.is_staff()));
create policy "preview: managers delete" on public.preview_tokens for delete to authenticated using ((select public.can_manage()));
revoke all on public.preview_tokens from anon;
grant select, insert, delete on public.preview_tokens to authenticated;

-- ------------------------------------------------------- ad-group mapping
-- Reference table: which ad group points at which page (R5). The site never
-- routes by it; it's for the team's bookkeeping.
create table public.ad_mappings (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null check (platform in ('google', 'meta', 'other')),
  campaign      text not null check (char_length(campaign) between 1 and 200),
  ad_group      text check (char_length(ad_group) <= 200),
  keyword_theme text check (char_length(keyword_theme) <= 200),
  page_id       uuid references public.pages (id) on delete set null,
  notes         text check (char_length(notes) <= 1000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger ad_mappings_touch before update on public.ad_mappings
  for each row execute function public.touch_updated_at();

alter table public.ad_mappings enable row level security;
create policy "ad_mappings: staff read" on public.ad_mappings for select to authenticated using ((select public.is_staff()));
create policy "ad_mappings: staff write" on public.ad_mappings for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
revoke all on public.ad_mappings from anon;
grant select, insert, update, delete on public.ad_mappings to authenticated;

-- page_content (home) edits are for staff; deleting it is never needed.
revoke delete on public.page_content from authenticated;
