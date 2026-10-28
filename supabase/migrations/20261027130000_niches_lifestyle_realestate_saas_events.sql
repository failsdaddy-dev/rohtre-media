-- Four more top-level niches for landing pages (2026-10-27, founder's list:
-- Fashion, Lifestyle, Clothing, Health, Real estate, SaaS, Event management).
-- Fashion and Clothing already exist; Health is "Health & wellness"
-- (20261027120000_more_niches). Each new niche has its own starter copy in
-- src/sections/niche-copy.ts. Safe to re-run: existing slugs are left alone.

insert into public.dimension_values (type_key, slug, label, headline_label, attrs, sort) values
  ('niche', 'lifestyle', 'Lifestyle', 'Lifestyle', '{}', 15),
  ('niche', 'real-estate', 'Real estate', 'Real Estate', '{}', 110),
  ('niche', 'saas', 'SaaS', 'SaaS', '{}', 120),
  ('niche', 'event-management', 'Event management', 'Event Management', '{}', 130)
on conflict (type_key, slug) do nothing;
