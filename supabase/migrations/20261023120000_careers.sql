-- Careers page applications (2026-10-23).
-- Free: two small tables in the existing database; no storage bucket
-- (resumes are emailed to HR as attachments and never stored).
--
-- careers_applications: one row per application from /careers. RLS is on
-- with NO policy for the public: only the server route inserts, using the
-- secret key (which bypasses RLS). Owner/developer read, update the status
-- and delete in Admin → Applications.
--
-- Deleting an applicant's data on request: Admin → Applications → open the
-- application → "Delete (on request)". That removes the row for good (the
-- audit log keeps only the action and the row id, no personal details).
-- The HR email copy lives in the HR mailbox and is deleted there.

create table public.careers_applications (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  category       text not null check (category in ('Internship', 'Full-time')),
  full_name      text not null check (char_length(full_name) between 2 and 80),
  email          text not null check (char_length(email) <= 120),
  phone          text not null check (phone ~ '^\+[0-9]{7,18}$'),
  role           text not null check (char_length(role) between 1 and 80),
  experience     text not null check (char_length(experience) between 1 and 30),
  portfolio_url  text check (char_length(portfolio_url) <= 300),
  message        text check (char_length(message) <= 1500),
  -- File name only (the file itself goes to HR by email).
  resume_name    text check (char_length(resume_name) <= 100),
  consent_at     timestamptz not null,
  status         text not null default 'new' check (status in ('new', 'contacted', 'rejected', 'hired')),
  source_page    text check (char_length(source_page) <= 200),
  ip_hash        text,
  -- Set when the HR email (or WhatsApp) failed, so the admin can follow up.
  notify_error   text check (char_length(notify_error) <= 300)
);

create index careers_applications_created_at on public.careers_applications (created_at desc);

alter table public.careers_applications enable row level security;

create policy "careers_applications: managers read" on public.careers_applications
  for select to authenticated using ((select public.can_manage()));
create policy "careers_applications: managers update" on public.careers_applications
  for update to authenticated using ((select public.can_manage())) with check ((select public.can_manage()));
create policy "careers_applications: managers delete" on public.careers_applications
  for delete to authenticated using ((select public.can_manage()));

grant select, update, delete on public.careers_applications to authenticated;

-- careers_private: settings that must not be public (unlike site_settings
-- and page_content): the HR email addresses applications are sent to.
create table public.careers_private (
  id             boolean primary key default true check (id),
  notify_emails  text[] not null default '{}' check (cardinality(notify_emails) <= 10),
  updated_at     timestamptz not null default now()
);

create trigger careers_private_touch before update on public.careers_private
  for each row execute function public.touch_updated_at();

alter table public.careers_private enable row level security;

create policy "careers_private: managers read" on public.careers_private
  for select to authenticated using ((select public.can_manage()));
create policy "careers_private: managers insert" on public.careers_private
  for insert to authenticated with check ((select public.can_manage()));
create policy "careers_private: managers update" on public.careers_private
  for update to authenticated using ((select public.can_manage())) with check ((select public.can_manage()));

grant select, insert, update on public.careers_private to authenticated;

insert into public.careers_private (id) values (true);
