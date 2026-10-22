-- Partner strip, round 3 (2026-10-22): how each badge logo is drawn on the
-- red band. Additive with a safe default, so existing rows keep working.
--   white    → the logo as a white silhouette (single-colour artwork on a transparent background)
--   plate    → the original logo on a small white rounded plate (detailed / multi-colour badges)
--   original → the logo exactly as uploaded
alter table public.badges
  add column if not exists logo_style text not null default 'white';

alter table public.badges
  drop constraint if exists badges_logo_style_check;
alter table public.badges
  add constraint badges_logo_style_check check (logo_style in ('white', 'plate', 'original'));

-- Per-badge choices after opening each file (see website.md, section 5b):
-- Google Partner and Microsoft Advertising are shown unaltered (their badge
-- rules forbid changes; both files are already light artwork that reads on
-- red). Meta and YouTube keep the white default (official mono-white
-- versions exist; the files are already white). The Indian Government Award
-- and "2B+" have no image (an icon / the number in white), so the style
-- doesn't change them.
update public.badges set logo_style = 'original'
  where image_public_id in (
    'rohtre-media/images/badges/google-premier-partner',
    'rohtre-media/images/badges/microsoft-advertising-select-partner'
  );
