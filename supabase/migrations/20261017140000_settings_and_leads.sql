-- Phase 1: global settings (R8, R9, R12), leads (R10, R38) and rate limiting.

-- ------------------------------------------------------------------ helpers
create or replace function public.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$ select (select public.current_role_name()) is not null $$;

create or replace function public.can_manage()
returns boolean
language sql
stable
set search_path = ''
as $$ select (select public.current_role_name()) in ('owner', 'developer') $$;

grant execute on function public.is_staff() to authenticated;
grant execute on function public.can_manage() to authenticated;

-- Signed-in staff read their profile (policies decide which rows).
grant select on public.profiles to authenticated;
grant insert, update, delete on public.profiles to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------- settings
-- One row. The shape of `data` is checked by the app (src/lib/settings.ts,
-- Zod); missing keys fall back to defaults there.
create table public.site_settings (
  id         boolean primary key default true check (id),
  data       jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;

-- Contact details are public: anyone may read the settings row.
create policy "settings: public read" on public.site_settings
  for select to anon, authenticated using (true);

create policy "settings: managers update" on public.site_settings
  for update to authenticated
  using ((select public.can_manage()))
  with check ((select public.can_manage()));

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

insert into public.site_settings (id, data) values (true, '{}'::jsonb);

-- ------------------------------------------------------------------ leads
create table public.leads (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  page_path            text not null check (char_length(page_path) <= 500),
  name                 text not null check (char_length(name) between 1 and 120),
  phone                text not null check (char_length(phone) between 5 and 30),
  email                text not null check (char_length(email) between 3 and 254),
  business_type        text check (char_length(business_type) <= 120),
  website              text check (char_length(website) <= 300),
  ad_spend_range       text check (char_length(ad_spend_range) <= 80),
  interest             text check (char_length(interest) <= 80),
  message              text check (char_length(message) <= 2000),
  consent              boolean not null check (consent),
  consent_at           timestamptz not null,
  consent_text_version text not null,
  utm_source           text check (char_length(utm_source) <= 200),
  utm_medium           text check (char_length(utm_medium) <= 200),
  utm_campaign         text check (char_length(utm_campaign) <= 200),
  utm_term             text check (char_length(utm_term) <= 200),
  utm_content          text check (char_length(utm_content) <= 200),
  gclid                text check (char_length(gclid) <= 300),
  fbclid               text check (char_length(fbclid) <= 300),
  referrer             text check (char_length(referrer) <= 500),
  user_agent           text check (char_length(user_agent) <= 500),
  ip_hash              text,
  sheet_synced_at      timestamptz,
  status               text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost', 'spam'))
);

create index leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

-- No anon access at all. Leads are written only by the server (secret key),
-- after validation, spam checks and rate limiting. Editors can't read them.
create policy "leads: managers read" on public.leads
  for select to authenticated using ((select public.can_manage()));

create policy "leads: managers update" on public.leads
  for update to authenticated
  using ((select public.can_manage()))
  with check ((select public.can_manage()));

create policy "leads: managers delete" on public.leads
  for delete to authenticated using ((select public.can_manage()));

revoke all on public.leads from anon;
grant select, update, delete on public.leads to authenticated;

-- ------------------------------------------------------------ rate limits
-- Fixed-window counter used by the lead route. Only the server (service role)
-- can call it.
create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into n;
  -- Clean up old windows now and then.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return n <= p_limit;
end
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ------------------------------------------------------- lead retention
-- Deletes leads older than the retention setting (R38). Called by the admin
-- "apply retention" action and, later, by a scheduled job.
create or replace function public.purge_old_leads()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  days integer;
  n integer;
begin
  select coalesce((data ->> 'leadRetentionDays')::integer, 730) into days from public.site_settings where id;
  delete from public.leads where created_at < now() - make_interval(days => days);
  get diagnostics n = row_count;
  return n;
end
$$;

revoke all on function public.purge_old_leads() from public, anon, authenticated;
grant execute on function public.purge_old_leads() to service_role;
