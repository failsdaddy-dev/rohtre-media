-- Home page redesign (2026-10-22): an optional company logo per testimonial.
-- The logo files are the client logos from the live site's "Brands we've
-- worked with" row, uploaded by `npm run seed:logos` to
-- rohtre-media/images/brands/{slug}. Only clear matches are filled in;
-- Harmiche.com has no logo in that row, so it stays empty.

alter table public.testimonials
  add column if not exists logo_public_id text
    check (logo_public_id ~ '^rohtre-media/[A-Za-z0-9_./-]+$');

update public.testimonials set logo_public_id = 'rohtre-media/images/brands/nealguides'
  where person_name = 'NealGuides' and logo_public_id is null;
update public.testimonials set logo_public_id = 'rohtre-media/images/brands/sidemen'
  where company = 'Sidemen' and logo_public_id is null;
update public.testimonials set logo_public_id = 'rohtre-media/images/brands/pedtalks-sports'
  where company = 'PedTalkSports' and logo_public_id is null;
update public.testimonials set logo_public_id = 'rohtre-media/images/brands/ea'
  where company = 'EA Sports Australia' and logo_public_id is null;
