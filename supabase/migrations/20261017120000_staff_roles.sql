-- Staff accounts and roles (R22). Phase 0: just enough for the signed
-- Cloudinary upload route to know who is calling. No public sign-up: an owner
-- creates staff in the Supabase dashboard and adds a profiles row.

create type public.staff_role as enum ('owner', 'developer', 'editor');

create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.staff_role not null default 'editor',
  full_name  text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- The caller's role, or null when signed out or inactive. SECURITY DEFINER so
-- policies can call it without recursing into profiles' own RLS.
create or replace function public.current_role_name()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p
  where p.user_id = (select auth.uid()) and p.active
$$;

revoke all on function public.current_role_name() from public;
grant execute on function public.current_role_name() to authenticated;

-- Staff read their own row; the owner reads and manages everyone.
create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "profiles: owner reads all" on public.profiles
  for select to authenticated
  using ((select public.current_role_name()) = 'owner');

create policy "profiles: owner manages" on public.profiles
  for all to authenticated
  using ((select public.current_role_name()) = 'owner')
  with check ((select public.current_role_name()) = 'owner');

-- Nobody signed out can see or change anything.
revoke all on public.profiles from anon;
