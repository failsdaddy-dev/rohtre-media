-- The sales addresses Contact enquiries are emailed to, edited in Admin → Contact
-- page. Private like the HR addresses beside them, so the existing policies apply.
alter table public.careers_private
  add column sales_notify_emails text[] not null default '{}'
  check (cardinality(sales_notify_emails) <= 10);
