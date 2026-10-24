-- Contact page enquiries (/contact). They go into the existing public.leads
-- table (same RLS: no public access; the server route inserts with the
-- secret key; only managers read, update and delete). Two new columns:
--   interested_in  every "Interested in" chip the visitor chose (the first
--                  one is still written to `interest`, so older screens work)
--   notify_error   why the sales email failed, shown in Admin → Leads
--
-- Retention / deleting a person's data on request: Admin → Leads → find the
-- person (search by name, email or phone) → "Delete (on request)". This
-- removes the row for good. Older leads are removed with "Delete leads older
-- than N days" (N = Admin → Settings → lead retention). The sales email copy
-- lives in the Gmail inbox and must be deleted there by hand.

alter table public.leads
  add column interested_in text[] check (cardinality(interested_in) <= 15),
  add column notify_error  text   check (char_length(notify_error) <= 300);
