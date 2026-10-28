# RohTre Media website - project memory

Read this first in every session; don't re-scan the codebase. No secrets here, ever.
Contract: `docs/claude-build-prompt.md` (R1-R45). Gate 0 plan: `docs/gate-0-plan.md`. Old site content: `docs/content/`.

## 1. Site map

| Path | Kind | Visibility | Status |
|---|---|---|---|
| `/` | home page (R13), order since 2026-10-22: dark hero (composition: headline + 16:9 video left, magnet illustration right; or the old slider), full-width partner strip, Who We Serve (dark, replaced the 9 service cards), Product Showcase, Scroll. Engage. Convert (dark, phone frames), Video Ads & Reels, Results (stacking, untouched), Client showcase, stripe band, Process, Brands we've worked with (dark logo marquee), Testimonials (marquee, + company logos), Founder, FAQ, CTA panel | public | built (Phase 2, redesigned 2026-10-22) |
| `/about` | rebuilt 2026-10-23 from the live page in the Home style: fixed-photo hero, red strip, Who we are, coloured counter cards, diversity bars, Year in Review video (19:10), team of 5 + founder bio, animated closing card. Content `page_content` key `about` (`src/content/about-schema.ts`) | public | built |
| `/careers` | rebuilt 2026-10-23 from the live page: studio-photo hero, awards strip, image+text blocks (photos owed), benefits, spotlights (Kartikay, Mrunal, Harshil, Nitish), values, 9 benefit cards, FAQ, closing card; "Apply" opens the application dialog (`#apply`). Key `careers` | public | built |
| `/contact` | rebuilt 2026-10-24: sky-blue section with cursor-reactive frosted tiles (`ContactScene`), form card (55%) beside "What happens next" + contact details (columns end level). Contact-only form (`src/components/contact/contact-form.tsx`): name, WhatsApp/phone (+91 default), email, business type, website, ad spend, Interested in (multi-select dropdown), message (1000), consent. Key `contact` | public | built |
| `/work` | built 2026-10-26 from the live `/work-2/`: fixed-photo hero (About technique), red strip that counts up (+200 clients, +7 roi, +2 Billion, +10 awards), intro, brand cards (whole card = one link, logo tile, card line, "View our work"), two offset 16:9 video slots (empty), closing `CtaPanel`. Key `work` | public | built |
| `/work/[slug]` | 10 brand pages, one template (`src/components/work/work-sections.tsx`): sky hero (back link, red eyebrow, H1, logo tile, paragraph, 2 buttons), red numbers strip, story cards (THE COMPANY/CHALLENGE/SOLUTION/RESULTS, coloured icon tiles), image, video slots, More work (3 cards), closing card. Rows in `work_brands`; unknown/unpublished slug = 404; params read inside `<Suspense>` | public | built |
| `/recognition` | built 2026-10-26 from the live `/recognition-2/`: scroll-snap slider (9 slides, arrows, dots, swipe, arrow keys, counter; autoplay always: 3 s per slide then a 1 s glide, incoming text fades in left to right (0.7 s), photo fades/settles; waits only after a swipe or in a hidden tab; no pause button (founder)), 4 award cards (founder's logo files), client quotes (5), team block (YouTube buttons image). Key `recognition` | public | built |
| `/terms-of-service`, `/privacy-notice`, `/fraudulent-use`, `/cookie-settings`, `/do-not-sell` | legal pages copied word for word from the live site (2026-10-24), one template (`src/components/legal/legal-template.tsx`), keys `legal-<slug>`, defaults in `src/content/legal-defaults.ts`. Old `/privacy`, `/terms`, `/terms-of-services`, `/cookie-settings-2` 301 to them (`next.config.ts`) | public | built |
| `/login`, `/no-access`, `/auth/signout` | sign-in in the main site's look (`src/components/auth-shell.tsx`: dark beams + grid + red glow, pill, two-tone headline, glow card, red button); no longer the vault's split stripe panel. With `ADMIN_LOGIN_PATH` set, the sign-in page is only at that secret address (rewrite in `next.config.ts`); `/login` and signed-out `/admin/*` answer 404 (`src/proxy.ts`, `src/lib/login-path.ts`). Unset = plain `/login` | private | built (Phase 1, secret address 2026-10-21) |
| `/admin` | overview + latest 20 leads (owner/developer) | private | built (Phase 1) |
| `/admin/pages`, `/admin/pages/[id]` | landing pages: create (service × niche × country), section editor (text, images, on/off, reorder, variants, custom HTML), save draft, publish check, publish/unpublish (developer, or owner if allowed), visibility, preview link (7 days), versions + restore, duplicate for another country | private (all staff; publish = developer) | built (Phase 4) |
| `/admin/about`, `/admin/careers`, `/admin/contact` | page editors, same rail + section pattern as Home (generated forms). Careers also holds the private HR email list (`careers_private`) | private | built 2026-10-23/24 |
| `/admin/work`, `/admin/recognition` | page editors (shared `src/app/admin/work/sections-editor.tsx`, About pattern). Work has a **Brands** tab (`brands-manager.tsx`): list, up/down, edit, delete (confirm), + Add brand, "Add the ten live brands"; brand form uses the shared save bar: name -> auto slug (editable before first save; format, reserved list, unique), published switch, logo, card line, hero, paragraphs, numbers, story cards, images, video slots, SEO; a published brand's slug is locked (unpublish + save first; DB trigger too) | private | built 2026-10-26 |
| `/admin/legal/[slug]` | legal page editor (custom, `legal-editor.tsx`): page fields, sections (H2/H3, label, subtitle) and blocks (paragraph, bullets, numbered, table, link button, image/video), add/edit/delete/move; unknown slug = 404 | private | built 2026-10-24 |
| `/admin/applications`, `/admin/applications/export` | careers inbox: filters, cards, status (new/contacted/rejected/hired), WhatsApp/Email, email-failure note, delete, CSV | owner/developer | built 2026-10-23 |
| `/api/careers` | application form (multipart, resume ≤ 4 MB emailed, never stored) | private | built 2026-10-23 |
| `/api/contact` | Contact page enquiries → `leads` + sales email | private | built 2026-10-24 |
| `/admin/home` | home page editor (`page_content` key `home`): section rail in site order + one section at a time (see section 5c) | private | built (Phase 4, redesigned 2026-10-22) |
| `/admin/proof` | results, testimonials, creatives, concept work, badges: edit, approve, tag to service/niche/country | private | built (Phase 4) |
| `/admin/media` | Cloudinary library: upload, see where used, delete (only when unused; also deletes from Cloudinary) | private | built (Phase 4) |
| `/admin/leads`, `/admin/leads/export` | lead inbox (restyled 2026-10-24 like Applications): search, status + source-page filters, cards, WhatsApp this client, sales-email failure note, delete on request (audited), purge older than retention, CSV export (formula-safe, incl. `interested_in`) | owner/developer | built (Phase 4) |
| `/admin/routing` | redirects (owner/developer) + ad-group → page reference table (all staff) | private | built (Phase 4) |
| `/admin/settings` | global settings incl. legal details and AI-crawler block list (owner/developer) | private | built (Phase 1, extended Phase 4) |
| `/admin/users` | staff: add (one-time password shown once), role, deactivate, reset password; always one active owner | owner | built (Phase 4) |
| `/admin/audit` | audit log, filter by area | owner/developer | built (Phase 4) |
| `/admin/security` | "Password" tab: change your own password | private | built (Phase 4) |
| `/preview/[token]` | draft preview by link (sha256-hashed token, 7 days, noindex) | private | built (Phase 4) |
| `/api/leads` | the one lead route | private | built (Phase 1) |
| `/api/cloudinary/sign` | signed upload (staff only) | private | built (Phase 0) |
| (all pages) | floating WhatsApp button: thin white icon, pop-in, pulsing halo, hover wiggle (`.rm-wa` in `design.css`; still under reduced motion) | public | updated 2026-10-21 |
| `/robots.txt` | generated from `src/lib/crawlers.ts` + settings `aiBots` | public | built |
| `/lp/[slug]` | landing pages (`src/app/(landing)/lp/[slug]/`): rendered from sections; drafts only while building; old slugs 301 | unlisted by default | built (Phase 3) |
| `/lp/meta-ads-fashion-brands-india`, `/lp/d2c-marketing-fashion-brands-india`, `/lp/meta-ads-fashion-brands-usa` | the 3 Phase 3 pages | unlisted, **draft** (publish-blocked) | waiting for founder content |
| `/sitemap.xml` | static pages + published *public* landing pages | public | built (Phase 3) |
| `/case-studies`, `/blog` | content | public | Phase 6 |

Public pages live in route groups that render `SiteChrome` (header, footer, WhatsApp button); the group sets the header tone (see section 5a):
- `src/app/(light-hero)/`: `/`, `/about`, `/work`, `/work/[slug]`, `/recognition`, `/careers`, `/contact` and the five legal pages (first screen is the sky-blue hero) → `transparent-dark-text`.
- `src/app/(site)/`: no pages now; **any new page by default** → `solid`. Root `not-found.tsx` → `solid`. (`(dark-hero)` was removed with the old Contact page; its tone entry stays in `GROUP_TONES`.)
Footer Legal column: Terms of Service, Privacy Notice, Fraudulent Use of Our Name, Cookie Settings, Do Not Sell My Info.
Header menu (2026-10-26): Home, About, Work, Recognition, Careers, Contact + Book a Call (`/contact#enquiry`); current page red (`src/components/nav-links.tsx`, Work stays current on brand pages); desktop links from 1024 px, menu button below. Book a Call from another page opens Contact at the top (`src/components/contact/contact-landing.tsx`; the Contact section uses `overflow: clip` because an `overflow: hidden` box got scrolled by the #enquiry jump). No theme toggle.

## 2. Data model

Applied to Supabase `rqvugkcoohzpylbbwqlb`:
- `20261017120000_staff_roles`: `profiles` (user_id, role owner|developer|editor, full_name, active); `current_role_name()`.
- `20261017140000_settings_and_leads`:
  - `site_settings`: one row; `data` JSONB checked by Zod in `src/lib/settings-schema.ts` (a bad key falls back to its default on its own). Anyone may read it; owner/developer update it.
  - `leads`: page_path, name, phone, email, business_type, website, ad_spend_range, interest, message, consent + consent_at + consent_text_version, utm_*, gclid, fbclid, referrer, user_agent, ip_hash, sheet_synced_at, status. No anon access; owner/developer read/update/delete; written only by `/api/leads` with the secret key.
  - `rate_limits` + `hit_rate_limit(key, limit, window)` (service role only); `purge_old_leads()` uses `leadRetentionDays`.
  - helpers `is_staff()`, `can_manage()`, `touch_updated_at` trigger.
- `20261017160000_home_content`:
  - `page_content` (key, data JSONB): home page text under key `home`, checked by `src/content/home-schema.ts` (section by section fallback to defaults). Public read; staff write.
  - `badges` (label, sublabel, image_public_id, proof_url, last_verified_at, enabled, sort, notes). The proof constraint was dropped in `20261017180000` (badges are a showcase). Public sees enabled only. No fields yet for a stat's number, unit, "as of" date or proof note (recommended for Phase 4).
  - `testimonials` (quote, person_name, person_role, company, photo_public_id, approved, is_placeholder, sort, notes). Public sees approved and not placeholder.
  - `results` (brand_name, logo, metric_value, metric_label, summary, image_public_id, image_alt, approved, is_placeholder, sort, notes). DB checks: an approved result can't be a placeholder and needs an image + alt.
  - Seeded from the live site, all switched off / unapproved: 6 badges (4 with images in Cloudinary `rohtre-media/images/badges/*`), 5 testimonials, 3 placeholder results.
- `20261017180000_badges_showcase`: drops the badge proof rule; switches on 5 badges.
- `20261022120000_testimonial_logos` (**written, NOT applied yet**; founder runs it): `testimonials.logo_public_id` + fills it for NealGuides, KSI/Sidemen, Pedram/PedTalkSports, Charlotte Marsh/EA. Until it runs, saving a testimonial in the admin fails (the form has the new field); the public page reads `*` so it works either way.
- Home content JSON (no migration): new sections `whoWeServe`, `products`, `engage`, `videoAds`, `showcase`, `brands`; `services` removed; hero slides are now `{desktop, mobile, href}` media slots (the old `alt` moved into each slot). `page_content` had no saved row, so nothing needed converting.
- Home content JSON, round 2 (2026-10-22, no migration, all additive with defaults so older saved copies still parse): hero `mode`, `tagline[]`, `video` (16:9 slot), `videoCaption`, `ctaNote`, `visual` illustration|media, `visualMedia` (slot 1:1/4:5/16:10/16:9); whoWeServe items `tint`; icon keys `shopify`, `network`; products slots 9:16 (also 3:4, 4:5) seeded with the live mockups; `showcase.items` replaced by `showcase.slides[]` (an old saved showcase falls back to the default slides); FAQ `status` replaced by `approved` (old `status: "ready"` is read as approved). Media slots gained the 16:10 shape and per-slot shape lists (`slotSchema([...])`).
- `20261022150000_badge_logo_style` (**written, NOT applied yet**; founder runs `npx supabase db push`): `badges.logo_style` text not null default `'white'`, check white|plate|original; sets `original` for Google Partner and Microsoft Advertising. Additive: until it runs the site reads badges with `select("*")` and treats a missing value as white; saving a badge in the admin says to run the update first.
- Home content JSON, round 3 (2026-10-22, no migration, additive with defaults): `engage.size` and `videoAds.size` (small|medium|large|xl, default medium); phone screens (`engage.phones[]`, `videoAds.items[].media`) are `phoneSlotSchema()`: shapes 9:19.5 (default) / 9:16 / 9:18 + `fit` fill|fit (default fill); `engage.phones` max 4 → 6; `finalCta.animated` (default true). Upgrade on read (`upgradePhoneSlot` in `home-schema.ts`): a non-phone shape → 9:19.5; in a section saved before `size` existed, an EMPTY 9:16 slot (old default) → 9:19.5; filled 9:16 slots keep their shape. The saved row changed on next save: engage phones 1-3 (9:16, 9:16, 16:9, all empty) → 9:19.5; Video Ads cards 1-4 (9:16, empty) → 9:19.5.
- Home content JSON, round 4 (2026-10-22, no migration, additive with defaults): `hero.video` is a landscape slot (16:9 default, + 16:10 / 4:3 / 21:9, `fit` default fill; old 16:9 rows read unchanged). `videoAds.stage` {left phone, centre landscape, right phone} and `videoAds.icons[2-6]` {title, icon}; `videoAds.items` (the old four cards) is **deprecated**: kept in the row untouched, not shown, hidden in the admin. Upgrade on read (`videoAdsStage` in `home-schema.ts`, only when `stage`/`icons` are missing, so it runs once): the first three cards with media move, in order, to Left phone / Centre screen / Right phone (a phone file in the centre becomes 16:9 + Fit); icons seeded from the card titles. With the row as last recorded (four empty cards) nothing moves. `founder.yearsSuffix` (default "+") and `founder.yearsLabel` (default "years as a digital consultant"); `yearsExperience` max 60 → 9999.
- Settings JSON, round 4 (no migration): `socials[]` = {network instagram|facebook|x|youtube|linkedin|threads|telegram|pinterest, url (string|null, read leniently), enabled (default true)}, max 16; default = the first five with empty links. Links are checked when saving (https only) and again before rendering (`src/lib/social-links.ts`).
- RLS check: `npm run check:rls` (37 checks against the live project; creates and removes a temporary editor, test lead, page and audit rows).

Planned (Gate 0 section 2.2): dimension_types/values, country_settings, pages, page_dimensions, page_versions, preview_tokens, media, clients, case_studies, testimonials, results, creatives, concept_works, proof_tags, badges, page_badges, redirects, ad_mappings, audit_log.

- `20261021120000_landing_system`:
  - `dimension_types` (service, niche, country) + `dimension_values` (type, parent_id for hierarchy, slug, label, headline_label, attrs). Seeded: services meta-ads, google-ads, d2c-marketing (children d2c-meta-ads, d2c-google-ads, R2); niche fashion (children clothing, shoes, jewellery, R6); countries india, usa, uk, australia, uae with attrs {iso, currency, locale, timeZone} (R7).
  - `pages` (slug unique, slug_auto, headline_auto, visibility public|unlisted|private default unlisted, status draft|published|archived, draft_version_id, published_version_id) + `page_versions` (number, content JSON = {meta, sections}) + `page_dimensions`.
  - `redirects` (from_path, to_path, 301); trigger `pages_slug_redirect` adds one on every slug change and collapses chains (R3).
  - `creatives` (client work: image|reel, brand, media, poster, approved, is_placeholder) and `concept_works` (separate table, no client, no metric, label_text default "Concept work - not a client project", R45).
  - `proof_tags` (item_type result|testimonial|creative|concept_work, item_id, value_id) (R18).
  - RLS: public reads published public/unlisted pages and only their published version; drafts and private pages hidden; editors can edit drafts but a trigger (`pages_guard_editor`) stops them publishing or changing visibility (R24).

- `20261021160000_admin`:
  - `media` (public_id, resource_type, bytes, width, height, format, uploaded_by): files uploaded through the admin. Only these can be deleted from Cloudinary, and only when nothing uses them (`src/lib/media.server.ts`).
  - `audit_log` (at, actor_id, actor_email, action, entity, entity_id, details): insert-only (update/delete revoked), staff append as themselves, owner/developer read.
  - `preview_tokens` (token_hash, page_id, version_id, expires_at): hidden from visitors; the preview page reads with the secret key.
  - `ad_mappings` (platform, campaign, ad_group, keyword_theme, page_id, notes): staff read/write, reference only (R5).
  - `page_content` delete revoked from signed-in users.
- Settings JSON gained `legal` {companyName, companyType, registeredAddress, privacyContactName, privacyEmail, jurisdictionCity} and `aiBots` (Phase 4; no migration, Zod defaults). Since the legal pages became live-site copies (2026-10-24) the `legal` settings are no longer shown anywhere.
- `20261023120000_careers` (**applied** by the founder): `careers_applications` (category, full_name, email, phone, role, experience, portfolio_url, message, resume_name, consent_at, source_page, ip_hash, status new|contacted|rejected|hired, notify_error); `careers_private` (one row, `notify_emails[]` = HR addresses). RLS on, no public policies; managers read/update/delete; inserts only by `/api/careers` with the secret key.
- `20261024120000_contact_enquiries` (**applied**): `leads.interested_in text[]`, `leads.notify_error text`. Contact enquiries are `leads` rows with `page_path` `/contact` and `consent_text_version` `contact-2026-10-24`; the first chosen interest also goes to `interest`. The Leads screen and export still load without these columns.
- `20261026120000_work_brands` (**applied** 2026-10-26; ten brands seeded with `npm run seed:work`, safe to re-run): `work_brands` (id, slug unique, name, published, sort_order, data JSONB checked by `brandSchema`, updated_by). RLS: public reads published only; staff read/insert/update/delete. Trigger `work_brands_lock_slug` blocks a slug change while published. Media used by brands counts as in use (`mediaInUse` in `page-ops.ts`). If the table can't be read the site shows the ten defaults.
- Work/brand/Recognition content: `src/content/work-schema.ts` (images are `pic` = media slot + `src` copy in `public/images/work|recognition`, shown until an upload), defaults `src/content/work-defaults.ts` (generated from the live HTML 2026-10-26), data `src/lib/work-data.ts` (tags `page:work`, `page:recognition`, `work:brands`; admin saves call `updateTag`, so new brands go live without a redeploy). Sitemap lists `/work`, `/recognition` and published brands.
- `page_content` keys (JSON, Zod, section-by-section fallback): `home`, `about`, `careers`, `contact`, `work`, `recognition`, `legal-terms-of-service`, `legal-privacy-notice`, `legal-fraudulent-use`, `legal-cookie-settings`, `legal-do-not-sell`. A page with no saved row shows its code defaults. `npm run seed:legal` stores the five legal defaults (only rows not yet saved; optional).
- Deleting a person's data: Admin → Leads (or Applications) → Delete; the copy in the Gmail inbox is deleted by hand.

## 3. Section library

Home page sections (Phase 2, `src/components/home/`), content in `src/content/home-schema.ts`:

| Section | Fields | Variants |
|---|---|---|
| hero | mode composition (default) or slider; eyebrow, h1, h1Accent, ctaLabel; composition: tagline[] (dot-separated), video (16:9 slot, loop clip or player with sound), videoCaption, ctaNote, visual illustration (coded `HeroMagnet`, inline SVG about 5.7 KB, official Shopify + Meta files, transform-only float 6.5-10 s, still for reduced motion) or media (`visualMedia`, shown whole: `MediaSlot fit="contain"`); slider: subline, WhatsApp button, slides[2] {desktop slot 12:5, mobile slot 4:5, href} | composition, slider |
| badges (partner strip) | enabled, eyebrow, title, accent, cta (items from `badges`, each with `logo_style`); red full-bleed band (`--brand`, white text 5.5:1, dividers = 26% white), cells re-flow by shown count (section 5b) | – |
| whoWeServe | eyebrow, title, accent, intro, items[1-8] {title, text, icon (`shopify` = official bag file), tint green/coral/purple/orange/blue, logos[0-3] {logo_public_id, alt}}, values[], cta. Icon on a 96 px (104 px from 1024 px) translucent disc of its tint | – |
| products | eyebrow, title, accent, intro, items[1-8] {label, action (one line), media slot 9:16}, cta. `ScrollRow` slider: scroll-snap, prev/next buttons (48 px, hidden at the ends, smooth only with motion), cards clamp(260px, 21.5vw, 340px), 2.2 visible from 640 px, 1.15 on phones | slider |
| engage | eyebrow, title, accent, subline, body, points[], phones[1-6] (phone slots in `PhoneFrame`), size, cta. 1 phone centred; 2-3 side by side, bottom-aligned, 1st/3rd raised 8%; 4+ a `ScrollRow` with arrows | – |
| videoAds | eyebrow, title, accent, intro, strapline + body (centred under the monitor, short red rule), stage {left phone, centre monitor, right phone}, icons[2-6] {title, icon reel/clapper/target/growth/…}, size, cta; `items` deprecated (not shown). Stage + icon row: see below | – |
| results | eyebrow, title, accent, intro, cta (items from `results`); image-only (not a media slot: that needs a `results` migration and changes its DB check). Media area 1:1 at up to 460 px (was 4:3), placeholder min 384 px (was 288) | – |
| showcase | eyebrow, title, accent, intro, slides[0-12] {brand, poster (slot 1:1 default, 4:5, 16:10), period, source, currency (₹ default), metrics[1-6] {label, value, decimals, prefix, suffix, icon trend/cart/box/eye/currency/cursor, enabled}}, cta. A slide with nothing in it is hidden on the live site | carousel |
| brands | eyebrow, title, accent, items[] {name, logo_public_id, alt, enabled} (order = list order), cta | marquee |
| process | eyebrow, title, accent, intro, steps[1-5], cta | – |
| testimonials | eyebrow, title, accent, variant, cta (items from `testimonials`) | grid, slider (marquee) |
| founder | eyebrow, quote (live-site CEO quote), name, role, bio, yearsExperience (the stat's number, null = hidden), yearsSuffix ("+"), yearsLabel, photo, ctaLabel. Stat = one flex row, baseline-aligned: number + symbol 29/32 px (1.6× the 18/20 px label), label wraps under it on narrow screens, 24 px above and below | – |
| faq | eyebrow, title, accent, items[] {q, a, approved}, cta. One 2-column grid, every closed card 96 px tall (question clamped to 2 lines), cards top-aligned so opening one moves no neighbour. Approval is shown only in the admin (no pills on the page); unapproved answers show only while building | – |
| finalCta | eyebrow, title, accent, text, label, animated (16 objects + pointer drift, section 5) | – |

**Phone frames and Video Ads sizes** (`src/content/layout-presets.ts`, the one place for these numbers; CSS in `design.css` reads them as custom properties):
- Phone: height = min(clamp(460px, 76svh, 820px) × size, 92svh) (vh fallback via `@supports`); width = height × frame ratio, also capped at the phone's share of its column (so 3 phones at 1366 px are column-limited, about 453 px tall, and a bigger size changes nothing there). Frame = screen + bezel 2.5% of the frame width (cqw), corners 13%, pill 26% wide. Screen shapes 9:19.5 / 9:16 / 9:18 (modern phones ≈ 430×932 CSS px).
- **Video Ads stage** (`VIDEO_STAGE`, CSS `.rm-stage`): from 768 px a grid of left phone | monitor | right phone, the phones in front (z-index 2) overlapping the monitor by 6% of its width each side; monitor width = 2.1 × the phones' average width, vertically centred (rows 1fr / auto / 1fr, the text in the bottom row between the phones). Phone height = min(clamp(380px, 62svh, 640px) × size, 68svh, container width ÷ `stageWidthFactor`), so it never overflows (768-1279 px is the same composition scaled by the container, cqw). Below 768 px: monitor full width, the two phones side by side (≤ 46% wide, ≤ 70svh), then the text. Pixel model for tests: `stageLayout()`. Empty screens inside the frames are dark dotted on light and dark sections.
- **MonitorFrame** (`src/components/media/media-slot.tsx`): same dark body (#0b0b0b), 1 px 15%-white edge and shadow as PhoneFrame, bezel 1.6% of the frame width (cqw), corners 2.4%, no brand marks; a slim stand exists but `SHOW_MONITOR_STAND = false`.
- **Icon row** (`.rm-icon-row`): one equal column per item from 1024 px (`--n`, 2-6), 2 columns below; thin dividers (15% of the text colour); white 56-88 px discs with a soft shadow and the red icon (new stroke icons reel, clapper, target, growth in `ServiceIcon`, drawn for this site); titles 17-18 px / 600, never truncated; a column narrower than 250 px puts the icon above the title (container query).
- **Hero video** (`HERO_VIDEO`, `.rm-hero-video`): up to 620 px wide, height from the shape; from 1024 px never taller than the 16:9 frame (349 px) unless the screen has room (100svh − 620 px), else ≤ 70svh; taller shapes get narrower instead of moving the headline or button.
- Sizes: small 0.8, medium 1, large 1.15, extra large 1.3 (`FRAME_SCALE`). Fill crops to the screen; Fit shows the whole file on black. A 9:16 video in a 9:19.5 screen loses about 18% of its width when filled: export at 9:19.5 (1080×2340).
- Checked in headless Chrome on static renders of the sections with the built CSS (not the running site): 1920×950 and 1366×657 (phones and the whole Video Ads card inside the screen), 1280, 1024, 390 (iframe of exact size), browser zoom 50% / 67% / 125% / 200% simulated by scaling the iframe.

**Shape registry** (`SHAPE_FAMILIES` in `media-slot.ts`): Phone (Modern 9:19.5 1080×2340, Classic 9:16 1080×1920, Tall 9:18 1080×2160), Landscape (Widescreen 16:9 1920×1080, Desktop 16:10 1920×1200, Classic 4:3 1440×1080, Ultrawide 21:9 2520×1080), Square and portrait (1:1, 4:5, 3:4, 12:5, unchanged). Each slot schema lists its shapes (`phoneSlotSchema`, `landscapeSlotSchema`, `slotSchema([...])`); the admin Shape list shows family headings, the name and the best upload size; slots with `fit` get Fill (crop to the frame, default) / Fit (show the whole video).
**Media slot** (`src/content/media-slot.ts`, `src/components/media/media-slot.tsx`, admin `src/components/admin/media-slot-field.tsx`): `{type image|video, publicId, format, alt, aspect (see the registry), loop, poster, bytes, duration}` (+ `fit` on phone and landscape slots); alt required for filled images. Fixed aspect ratio (no layout shift). Image = Cloudinary srcset (f_auto, q_auto, widths 320-2400). Video = a still (poster, or first frame `so_0`) under the clip; loop clips are muted, get their file only when in view (`MediaPlayback`, IntersectionObserver, starts after page load, max 3 playing, pause off screen, nothing for reduced motion or save-data); other videos get controls + `preload="none"`. GIF = image upload delivered as a looping MP4 (`.mp4` extension) with a `pg_1` still. Empty = neutral dotted frame, labelled "Placeholder · 9:19.5 (1080×2340) · image or video · up to N MB" only outside production. `PhoneFrame` = CSS phone (no brand marks) around the slot's own shape (it used to force 9:16, which is why the admin's Shape did nothing). Limits in `src/lib/media-limits.ts`: images 10 MB, video 100 MB (Cloudinary Free, verified on cloudinary.com/pricing/compare-plans), loop clip warning above 10 MB or 15 s, 3 playing at once. Admin form: any slot-shaped field gets the slot editor automatically. Launch blockers: `src/lib/home-blockers.ts`, shown on Admin → Home page.

**Client showcase carousel** (`src/components/home/showcase-slider.tsx`): all slides in one grid cell (height = tallest, no jump), one visible; arrows 48 px (56 px from 1024 px) below the slides on phones/tablets and at the section edges from 1024 px; ←/→ keys when the carousel has focus; swipe (pointer, 40 px); wrap-around; `aria-live` "Slide n of N"; `role=region` + `aria-roledescription=carousel`; no autoplay; one slide = no arrows. Slide layout: poster 46% + metrics panel (brand, short red underline, optional "period · source", 3×2 grid with 1 px dividers; 2×3 on phones).
**Count-up** (`src/lib/count-up.ts`): `COUNT_UP_MS` 1400, ease-out cubic; text = prefix + value.toFixed(decimals) + suffix, the last frame is exactly the stored text; starts the first time the carousel is 35% in view and again on every slide change; the server renders the final value, the invisible final text reserves the width (tabular numerals), `aria-label` on each value; reduced motion = final values only. Icon tints per metric: ROAS/Sales/Orders coral (pink), Impressions purple, Lower CPA orange (currency symbol), Conversion blue.
**Icon tints**: `--tint-green|coral|purple|orange|blue` in `globals.css` (darker on light cards, brighter in `.rm-dark`); disc = 16% of the tint; icon-to-disc ≥ 3:1 checked in `tests/theme.test.ts`.
**Admin lists** (all generated forms, `ListField` in `schema-form.tsx`): compact rows (thumbnail, short title, shown/hidden switch when the item has `enabled`, ↑ ↓ ⧉, ✕ then "Delete?" to confirm), one row open at a time, "+ Add {noun}" on top with the count (`noun` hint). Lists of plain text stay inline. Home editor hints can differ per section (`TAB_HINTS`); `COMMON_HINTS` holds the plain-language labels shared by all forms.

**Media sizes at 1920 px** (computed from the CSS, not measured in a browser):

| Area | Before | Now | 1366 px | 390 px |
|---|---|---|---|---|
| Hero video (16:9) | none | 620 × 349 | 620 × 349 | 358 wide |
| Hero visual | none | about 708 wide (640:560) | about 634 wide | 358 wide, below the button |
| Who We Serve icon disc | 52 px square | 104 px circle | 104 | 96 |
| Product card / frame | 218 card, 194 × 242 (4:5) | 340 card, 316 × 562 (9:16) | 294 card (4 + 63 px peek) | 311 card (1.15 visible) |
| Phone frame | about 247 × 426 | 370 × 645 | 333 × 580 | 172 wide |
| Video Ads stage (round 4) | 4 cards 378 wide | phones 589 tall, monitor about 587 wide (950 px tall window) | phones 447 tall (68svh) | monitor 358 wide, 2 phones below |
| Client poster | 223 × 279 (4:5) | 530 × 530 (1:1, 46%) | 530 | full width |
| Results media | 460 × 345 / placeholder 288 tall | 460 × 460 / 384 tall | same | full width |

Wider containers: hero 1440, products 1600, phones section 1440, video ads 1680 (others stay 1200).

Landing-page section registry (Phase 3, R28) - `src/sections/schemas.ts` (data), `src/sections/render.tsx` (components), `src/sections/master-template.ts` (default page), `src/sections/tone.ts` (header tone):

| Type | Fields | Variants | Header tone when first |
|---|---|---|---|
| hero | eyebrow, h1 (auto), subline, ctaLabel, offerBanner {desktop, mobile, alt} | banner-right, banner-below | transparent-light-text |
| badges | eyebrow, badgeIds (empty = all switched on) | bar | – |
| painPoints | eyebrow, title, accent, items[1-6] | cards, list | – |
| results | eyebrow, title, accent, intro, limit 1-3, cta (items = matched proof) | stack, grid | – |
| creatives | eyebrow, title, accent, intro, limit, showConcept | images-first, reels-first | – |
| platforms | eyebrow, title, accent, items[] | cards | – |
| testimonials | eyebrow, title, accent, cta (matched) | slider, grid | – |
| process | eyebrow, title, accent, intro, steps, cta (off by default) | timeline | – |
| faq | eyebrow, title, accent, items {q, a, status}, cta (fresh per page) | two-column | – |
| form | eyebrow, title, accent, intro, formTitle, defaultInterest (id="enquiry") | split | – |
| customHtml | html, mode sanitized (allow-list, no scripts/iframes/handlers) or raw (owner/developer only; scripts run under the site CSP, so third-party script hosts must be added to `next.config.ts`) | contained, full-width | – |

Master template order (R15): hero, badges, pain points, results, creatives, platforms, testimonials, process (off), FAQ, form. Angle by channel (R21): Meta → reels-first + Facebook/Instagram; Google → images-first + Search/Shopping/YouTube; D2C → both.
Adding a section type = schema + entry in `SECTION_TYPES` + renderer case + test; no migration.
Proof matching (`src/lib/proof-match.ts`): an item shows if, for every dimension, it is untagged or tagged with the page's value or an ancestor; exact > ancestor > untagged, then sort.
Publish check (`src/lib/publish-check.ts`, R25): slug format/unique, visibility, schema-valid content, meta title/description, one hero first with H1, offer banner desktop + mobile + alt, form on, proof sections must have approved matched items (else switch off), FAQ answers "ready", chosen badges switched on, concept items labelled, no [NEEDS DATA] / TO CONFIRM.
Admin forms are generated from the same Zod schemas (`src/lib/json-schemas.ts` → `src/components/admin/schema-form.tsx`), so a new section type gets an editor automatically. Shared page operations (create, save, publish, duplicate) live in `src/lib/page-ops.ts`, used by both the admin and the script.
Page tool (script, still works): `npm run lp -- list | seed | check <slug> | publish <slug> | duplicate <slug> <country>` (`scripts/landing.ts`, runs through vite-node with the server-only key).

## 4. URLs and slugs

- Landing pages: `/lp/{service}-{niche}-brands-{country}` (Gate 0 option B), from `slugFor()`; duplicates get -2, -3 (`uniqueSlug()`). Editable; a slug change adds a 301 (DB trigger) and the page route follows `redirects`.
- H1: `headlineFor()` = "{Service} for {Niche} Brands in {Country}", e.g. "Meta Ads for Fashion Brands in the USA" (R4).
- Everything under `/lp/` is unlisted by default.

## 5. Theme tokens and design (`src/app/globals.css`, `src/app/design.css`)

**No theme toggle.** Light tokens on `:root` (page `#f5f4f0` warm off-white, cards `#ffffff`, text `#0a0a0a`, red `#d4000f`); `.rm-dark` redefines the same tokens (`#080808` page, `#000000` cards, white text, red `#e50914`). Don't use `light-dark()`: Tailwind/Lightning CSS compiles it into a fallback fixed at `:root`, which made every dark section render light (bug found 2026-10-17). Gradient headings: `.rm-text-grad` with `--grad-a/b/c` (red family). Contrast: `tests/theme.test.ts` (29 checks, both palettes).
Design modelled on the effects of peakpilots.in (reference only; our colours, font, buttons and content):
- Motion: `src/lib/motion-boot.ts` (inline in `<head>`) only sets `html[data-motion]`, `html[data-scrolled]`, `html[data-intro]` (`<html>` has suppressHydrationWarning). `src/components/motion.tsx` reveals `[data-reveal]` elements (fade-up 0.8 s, cubic-bezier(0.22,1,0.36,1), `--d` stagger; values `up-lg`, `fade`) and scrubs `.rm-fill-line` by scroll, both with the Web Animations API, so no page attribute ever changes: changing attributes before late-hydrating sections caused React hydration warnings (fixed 2026-10-17).
- Smooth scrolling: Lenis (`src/components/smooth-scroll.tsx`, lazy-loaded, about 4 KB; off for reduced motion).
- Intro splash (`src/components/intro.tsx`): Vault-style stripes + "ROHTRE MEDIA", first page of a visit only, never on /lp, /admin, /login, /preview.
- Header: sticky; transparent with white logo/nav over a `.rm-hero-dark` hero, white with dark nav once `data-scrolled` (0.5 s transitions).
- Hero: full-screen `.rm-beams` (drifting light beams drawn in CSS + red glow). Composition layout (default): pill, two-tone H1, dot line, 16:9 video, Book a Call + small line on the left; magnet illustration or uploaded visual on the right. Slider layout: centred H1, Book a Call + WhatsApp, the 2-slide slider below in a framed card.
- Cards: `.rm-glow-card` (black square; hover = 4-corner red/white gradient border + blurred bloom) on dark; `.rm-card` (white, soft shadow, lift on hover) on light.
- Home CTA card: 6 basic accents (`PanelAccents`) + 10 objects (`CtaDecor`: 2 rings, plus, square, cart, parcel, heart bubble, thumbs-up, bell, rupee coin) = 16, inline SVG in red/white/grey, aria-hidden, pointer-events none. Pointer drift (`CtaParallax`) only while a mouse is over the card: depth layers 24/14/8 px, lerp 0.08, rAF only while moving, passive listeners, `translate` only, card size read once per hover; idle float 6-12 s (`.rm-idle`), paused off screen. Off for touch (pointer: coarse) and reduced motion. Objects in the text's safe zone at ≤ 0.25 opacity. Admin: Final call to action → Show animated objects. Other pages' CTA panels are unchanged.
- Footer: copyright left, social icons right (stacked and centred on phones); 46 px round buttons with the line border, red fill on hover, focus ring; brand marks from Simple Icons 16.35.0 (CC0 project licence checked; marks stay their owners' trademarks) in `src/components/brand-icons.tsx`, LinkedIn drawn for this site (not in Simple Icons). Render rule in `src/lib/social-links.ts` (shown AND valid https link; none = no row; outside production switched-on icons without a link show dashed and dimmed, unlinked). Links open in a new tab, `rel="noopener noreferrer"`, aria-label "RohTre Media on {Platform} (opens in a new tab)".
- Results: `.rm-stack` sticky stacking cards (white / red / black). `.rm-stripe-band`: "ROHTRE MEDIA" in moving red/off-white stripes. Testimonials: `.rm-marquee` two rows, opposite directions, pause on hover. FAQ: `.rm-faq` details with smooth height. Final CTA: dark `CtaPanel` with dots, squiggles, quarter circles.
- Work/Recognition (`.rm-work*`, `.rm-rec*` at the end of `design.css`): white + sky bands, `.rm-svc` cards, red strip = `.rm-badges.rm-about-strip` with `data-about-count` (count-up by `AboutMotion`). Phones (< 640 px): compact brand cards (logo beside text), slider controls in one row (dots hidden), bottom-left clear of WhatsApp. Local images use `<img>` (next/image goes through the Cloudinary loader). Phones/tablets: scrolled header nearly opaque.
- All motion off for prefers-reduced-motion.

## 5a. Header tone (`src/lib/header-tone.ts`)

- `HeaderTone` = `"solid"` (default) | `"transparent-dark-text"` | `"transparent-light-text"`. In every tone the scrolled header is the same white bar with dark logo and links (unchanged).
- Set on the server: the route-group layout passes `tone` (from `GROUP_TONES`) to `SiteChrome` → `SiteHeader`, which writes `data-tone` on `<header>`; CSS in `design.css` styles `html:not([data-scrolled]) .rm-header[data-tone=…]`. First paint is correct (no flash, no layout shift). `resolveHeaderTone()` turns anything missing/unknown into `solid`, so forgetting a tone is harmless.
- Never style the header from other page content (`body:has(...)`): with Cache Components, pages you navigated away from stay in the DOM hidden (React Activity), which is what made the header white on Privacy/Terms (fixed 2026-10-21).
- Where each page declares its tone: `(light-hero)/layout.tsx` → `transparent-dark-text` (every public page: Home, About, Work + brand pages, Recognition, Careers, Contact, the five legal pages); `(landing)/lp/[slug]/layout.tsx` → the same light-hero tone (since 2026-10-27 the landing hero is the light sky hero; the layout no longer reads the URL, which fixed the Cache Components "instant" warning); `(site)/layout.tsx` → none → `solid`; `not-found.tsx` → `solid`. The hero section type declares `transparent-dark-text` (`src/sections/schemas.ts`); `pageHeaderTone()` is still used by `/preview`.
- **Phase 3 hook:** every hero/section type in the future section registry declares the header tone it needs, and a page takes its header tone from its first enabled section; if none declares one the default is solid. The registry reuses the exported `HeaderTone` type.
- Test: `tests/header-tone.test.ts` (lists the 12 public pages; all start light; landing layout doesn't read params).

## 5b. Badge render rule (`src/lib/proof.ts` → `publicBadges`)

**Strip layout** (`badgeLayout()` / `BADGE_LAYOUT` in `layout-presets.ts`, CSS `.rm-badges[data-group]`): 1-3 badges one row, logos 88 px, cells ≤ 380 px centred; 4 one row, 80 px; 5-6 one row from 1280 px (68 px), else rows of 3 (3+3 / 3+2 centred); 7+ rows of 4 at 56 px; phones 2 columns at 44 px, last row centred. Labels 14 px white. The band is full-bleed, the cells sit in a 1600 px max-width row.
**Logo styles** (`badges.logo_style`): white = `brightness(0) invert(1)` silhouette (one-colour art on transparency); plate = original on a white rounded plate (detailed/multi-colour); original = as uploaded. Choices after opening every file (all transparent PNG/WebP, light artwork): Google Partner original (151×110, Google's badge rules forbid altering it; it's already white), Meta Business Partner white (white lockup), YouTube white (official mono-white icon, triangle cut out), Microsoft Advertising original (light art + a light "2025" panel with dark text that white would erase; a white plate would hide the light art), Indian Government Award and "2 Billion+" have no image (white award icon / the number in white). The admin warns when a badge logo uploaded through the admin is a JPG. Brand checks: YouTube mono white on red verified (brand.youtube); Meta mono white allowed for low-reproduction use, partner lockups need Meta approval (verified: meta.com/brand/resources/meta/company-brand); Google Partner badge must not be altered, must be ≥ 100 px tall and should come from the official HTML snippet (verified: support.google.com/google-ads/answer/9028798), so our 56-88 px logo heights are under Google's minimum; Microsoft Advertising badge rules are behind the partner login (unverified).
A badge renders on the public strip only if `enabled` is true, in every environment (dev included), applied in both the data query (`getBadges`, public client) and the `BadgeBar` component. Disabled badges never render; there is no dev preview of them on public pages. The strip has one column per visible badge from 768 px up; on phones 2 columns with an odd last badge spanning the row.
Open decision: the 2026-10-21 fix request asked for "enabled AND proof AND not placeholder"; with today's data that hides all 5 badges (none has `proof_url`; no proof-note or placeholder field exists), which contradicts the founder's 2026-10-17 showcase decision. Kept the showcase rule until the founder decides.

## 5c. Admin layout

- Top navigation (`src/components/admin/admin-nav.tsx`, since 2026-10-24): from 1360 px Overview, **Company** menu (Home, About, Work, Recognition, Careers, Contact page), **Legal** menu (the five legal pages), Landing pages, Proof & badges, Leads, Applications + "More" (Media, Redirects & ads, Settings, Users, Audit log) + account menu (name from 1600 px, role, Password, View website, Sign out); below 1360 px one "Menu" button with everything, grouped under Company / Legal headings. Same routes and role rules (`ADMIN_TABS` with a `group`: primary | company | legal | more | account). Menus close on Escape, an outside click or navigation.
- Shared `Select` gained `inline` (list opens under the box in the page flow, also on touch; used in the careers dialog and the Contact form). Contact's "Interested in" uses `src/components/contact/multi-select.tsx` (same look, several choices).
- Home page editor: left rail (240 px, from 1024 px) of every section in site order with icon, name, a green/grey shown dot and the count of empty slots/blockers; ↑/↓/Home/End move through it (`aria-current`). Below 1024 px a "Section" dropdown. Right: section name, one sentence (what and where), "Show this section" switch, "View on site ↗" (`/#anchor`: partners, services, products, engage, video-ads, results, client-results, process, brands, testimonials, founder, faq, lets-talk), then cards Words / Pictures & videos / Button / Advanced (closed). In the composition hero layout the slider fields move to Advanced, and the other way round.
- Save bar (`save-bar.tsx`): sticky; Saved / Unsaved changes / Saving… / the error; Discard; leaving with unsaved edits asks first (the browser's prompt on close/reload, an in-bar "Leave without saving?" on admin links). Used on Home page, Landing page editor, Settings and Proof & badges. Save calls are unchanged.
- **Dropdowns: one `Select`** (`src/components/admin/select.tsx`) replaces every native `<select>` in the admin (12 before, 0 after; the only `<select>` left is its touch fallback). Same props as a controlled select (value, onChange(value), options, disabled, name → hidden input for FormData, id, aria-label, required, invalid). WAI-ARIA APG "Select-Only Combobox" pattern (checked on w3.org, page updated 12 Aug 2025): combobox trigger (aria-expanded, aria-controls, aria-activedescendant), listbox/option (aria-selected), arrows, Home/End, PageUp/PageDown, Enter/Space/Alt+Up choose, Tab chooses and moves on, Escape closes, type-ahead. Popup portalled to body, fixed, flips up, ≥ trigger width, max min(320px, 50svh), z-index 1000 (above header z-30 and save bar z-20), follows scroll/resize, closes on outside click; options ≥ 44 px, red-tint highlight, check mark, optional hint/description/group heading/icon. 140 ms fade + slight scale, none for reduced motion. Coarse pointer → native select in the same box. Admin-only code (not in any public page's JS; checked in the build).
- Settings → Social links: rows of platform (Select with icon preview; each platform once), link (live https check + soft warning when the host isn't the platform's), Shown/Hidden switch, ↑ ↓, delete with a confirm click, "+ Add social link". Saved with the settings form (same save call, `updateTag(SETTINGS_TAG)`).
- Home editor, Video ads & reels: Words (incl. strapline/paragraph under the screen), Screens (Left phone / Centre screen / Right phone, each limited to its family), Icon row (title + icon picker with previews), Frame size. Founder: Number / Symbol after the number (optional) / Label, in Words.
- Proof & badges: the badge form has Logo style with a live preview of the red cell; tabs wrap instead of scrolling; Delete needs a second click.
- **2026-10-27 admin polish** (`admin-frame.tsx`): red loading bar at the top on every admin navigation (`admin-progress.tsx`); `AdminLoading` = bar + spinner + grey shimmer skeleton (no plain "Loading…"); a black **Live** strip under the header (pulsing green dot, "Saved page edits go live in seconds · Landing pages go live when published", Help, Open website ↗); **Quick find** (`admin-search.tsx`, Ctrl/⌘+K or the search button next to the logo): searches every admin page by name, plain-words `hint` (new field on every `ADMIN_TABS` entry) and aliases, grouped results, portalled to `<body>` (inside the blurred header a fixed overlay is trapped), closes on Esc / outside click; Overview "Find your way" cards (4 groups); **Help & guide** page `/admin/guide` (how it works, 4 step-by-step jobs, glossary, habits). Page fade-in, all motion off for reduced motion.
- **Switches**: every on/off checkbox (`input[role="switch"]`) is drawn as a pill switch (grey off, red on; CSS in `design.css`); `Toggle` row in `ui.tsx` (title, hint, switch, On/Off word). Settings: WhatsApp button, chat card, careers line, and a separate **Publishing** panel with "Owner can publish landing pages" (owner-only). Multi-choice tick boxes stay checkboxes.
- **Landing pages admin**: Delete page panel (owner/developer; type the slug to confirm; versions/preview links/tags cascade, leads kept; `deletePage` in `admin/pages/actions.ts`). New-page dropdowns show plain names (no "— " before children).
- `Select` fix (2026-10-27): scrolling inside the list no longer re-places it (that re-render snapped the list back to the active option); it follows the active option only on open and keyboard moves; `data-lenis-prevent` on the list.
- Save bar "Saved" pill: derived from the message (no setState inside the effect; lint rule).
- Ideas not built (other admin pages): Landing pages list as compact rows with status chips; a Media library grid filter (unused / images / videos); Leads saved filters; a Settings section rail like the home editor.

## 6. Visibility and bots (`src/lib/crawlers.ts`)

- robots.txt: `*` allowed except /admin /login /preview /api. AI tokens from settings `aiBots` (default 17) disallowed from `/lp/`; an empty list drops that group. AdsBot-Google, AdsBot-Google-Mobile, facebookexternalhit and meta-externalads have their own allow group (AdsBot ignores `*`).
- `src/proxy.ts`: AI user agents (settings `aiBots`, re-read at most every 5 min per server instance) get 403 on `/lp/*`; ad bots always pass. It also gates `/admin`.
- Headers (`next.config.ts`): `/lp/*` sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`; admin, login, preview and api send noindex.
- Limit: bots that fake a browser user agent, and AI agents running in a person's browser, can't be stopped. Only login hides a page.

## 7. Decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-10-17 | No blueprint; the build prompt is the only contract | Founder: "proceed without blueprint" |
| 2026-10-17 | Gate 0 defaults accepted ("start building") | Founder |
| 2026-10-17 | **No paid subscriptions**: Supabase Free, Cloudinary Free, hosting must be free | Founder. Replaces Gate 0's Vercel Pro / Supabase Pro advice |
| 2026-10-17 | No Docker: migrations are tested on a hosted Supabase **free** project, not a local stack | Founder; Docker isn't installed |
| 2026-10-17 | Deleting an image in admin also deletes it from Cloudinary (`destroyAsset`), once nothing references it | Founder. Details in open items |
| 2026-10-17 | Next.js 16.4.2, `cacheComponents` + `partialPrefetching`, Tailwind v4 through the Turbopack loader (same as the vault) | Current versions; matches the vault |
| 2026-10-17 | Content and contact details come from the live site; claims without proof stay blocked | Founder; rule 4, R19 |
| 2026-10-17 | Supabase CLI linked (founder ran login + link + db push); migration `20261017120000_staff_roles` applied; the existing user is set as **owner**. Supabase project `rqvugkcoohzpylbbwqlb` (free) and Cloudinary cloud `rx0ucmiq` (free) connected; keys only in `.env.local`, all three checked working | Founder |
| 2026-10-17 | Logo: wordmark from the founder, repainted black (light theme) and white (dark theme) in `public/brand`; favicon = the R mark, transparent SVG (`src/app/icon.svg`) that is black on light browser tabs and white on dark ones; `apple-icon.png` is a white R on dark because Apple needs an opaque icon. Sources and extra versions (red R) in `docs/brand` | Founder |
| 2026-10-17 | Social links are placeholders (settings `socials[].url = null`), hidden until real URLs are added | Founder |
| 2026-10-17 | Leads go to Google Sheets (Meta and Google Ads lead forms). Resend and Turnstile are not used | Founder |
| 2026-10-17 | Website form: saved in Supabase, then copied to the founder's Google Sheet through a Google Apps Script web app (`docs/setup/google-sheets-leads.md`) after the response. The instant alert is Google Sheets' own notification email instead of a separate email service (replaces R10's email alert) | Founder (leads in Sheets) + Gate 0 default |
| 2026-10-17 | Spam protection without third parties: honeypot field, minimum 3 s fill time, same-origin check, 5 leads per 10 min per hashed IP | Turnstile dropped |
| 2026-10-17 | WhatsApp: site number 919695747475 and HR number 919670111008, both from the live site's links. The message template uses {page}, filled at click time from the page title or `data-wa-*` attributes | Live site |
| 2026-10-17 | The lead form uses the browser's built-in checks; Zod runs only on the server (saves 31 KB of JS on form pages) | R35 |
| 2026-10-17 | Content-page claims left out until proved: live-site stats, awards, "Google-certified", US-style benefits | Rule 4, R19 |
| 2026-10-17 | Placeholders and unapproved items show (striped, labelled "not shown on the live site") only while building (`npm run dev`, `SHOW_PLACEHOLDERS` in `src/lib/home-data.ts`, read with the server-only secret key); any production build leaves them out. The database refuses switched-on badges without proof and approved placeholders | R19 |
| 2026-10-17 | Home H1 is visible (under the slider), not screen-reader-only: no official Google guidance found on hidden H1s | R14 (unverified) |
| 2026-10-17 | Hero slider without a library (CSS scroll-snap + about 1 KB JS); slide 1 `loading=eager` + `fetchPriority=high`, slide 2 lazy; art direction with `getImageProps` + `<picture>` (Next 16 deprecated `priority`) | R14, R35 |
| 2026-10-17 | Badge artwork is white on transparent (as on the live site); CSS `.rm-white-art` turns it black outside dark sections | R43 |
| 2026-10-17 | Redesign v2 after founder review: dark sections were rendering light (light-dark() bug), motion not smooth. Rebuilt to match the reference effects: explicit dark tokens, Lenis smooth scroll, IntersectionObserver reveals, glow cards, stacking cards, stripe band, fill lines, intro splash, header over hero. Light sections now warm off-white #f5f4f0 like the reference | Founder |
| 2026-10-17 | **Theme toggle removed**; alternating light/dark sections instead. Redesign after peakpilots.in as a reference only (layout and motion ideas; colours, font, buttons and content stay ours). Not taken: their colours, stats, "industries" strip, copy | Founder |
| 2026-10-17 | **Badges are a showcase**: shown when switched on, no proof link needed (DB constraint dropped in `20261017180000_badges_showcase`). 5 badges live; "2B+" off until conversions-vs-views is confirmed. Replaces R11's proof rule and R25's badge check | Founder |
| 2026-10-21 | Landing pages: data in Supabase (dimensions, pages, versions, proof tags); sections validated by Zod; rendered and cached by Next (`use cache`, tags `landing` / `lp:{slug}`); `generateStaticParams` returns published slugs or the reserved `_` (Cache Components needs at least one) | R28, R35 |
| 2026-10-21 | The 3 Phase 3 pages are drafts built only from the master template's generic copy; no client facts invented. They stay publish-blocked until the founder supplies offer banners, tagged results/creatives/testimonials and approved FAQ answers | Rule 4, R19 |
| 2026-10-21 | Badge rule kept as "switched on = shown" (founder did not choose the proof rule) | R11 |
| 2026-10-21 | Git: only `dev` (all work) and `main` (whole code when the site is done; starts at the Phase 0 commit). No phase/fix branches | Founder |
| 2026-10-21 | Header tone system (solid default) set per route group on the server; `body:has(.rm-hero-dark)` removed (it matched hidden previous pages) | Fix request |
| 2026-10-21 | Disabled badges never render, dev included; strip columns follow the visible count | Fix request |
| 2026-10-17 | Lenis added as a dependency (smooth scrolling the founder asked for; about 4 KB, lazy) | R35 rule 8 |
| 2026-10-17 | Home sections end with their own centred CTA (button + small line) instead of a separate strip; final CTA is the dark `CtaPanel` with Book a Call + WhatsApp | R13 |
| 2026-10-17 | Home services: the 9 agency services (Gate 0 default); no service pages yet, so cards don't link | Gate 0 Q2 |
| 2026-10-21 | All content (banners, slides, results, creatives, testimonial approvals, "2B+", legal details, founder years) is added by the founder through the admin after the build; placeholders stay until then | Founder |
| 2026-10-21 | Booking tool: option A, form only (Book a Call → `#enquiry`) | Founder |
| 2026-10-21 | Secret admin sign-in address from env `ADMIN_LOGIN_PATH` (value only in `.env.local` / host settings; changing it needs a restart/rebuild). It hides the admin; the password and RLS still do the protecting | Founder |
| 2026-10-21 | Login and no-access pages redesigned in the main website's style so they don't look like rohtre-vault | Founder |
| 2026-10-21 | **No 2FA**: admin sign-in is email + password only (2FA screens and checks removed after Phase 4). R22 "offer 2FA" declined | Founder |
| 2026-10-21 | New staff get a random 20-character one-time password shown once to the owner (no email service needed); they change it on the Password tab | R22, no paid services |
| 2026-10-21 | Media delete: only files uploaded through the admin, only when nothing uses them (pages, home content, proof). No trash folder | Founder (delete from Cloudinary) |
| 2026-10-21 | Confirmations in the admin are two-click buttons, never browser dialogs | R44 |
| 2026-10-22 | Home redesign after the live e-commerce page (structure + wording only, our UI): 9 service cards removed (component, `services` content key and `.rm-tag` CSS; `ServiceIcon` kept, landing pages use it); new sections listed in section 3; partner strip full-width; in-page Book a Call = `ButtonLink size="lg"` (56 px, 18 px text); header button 44 → 48 px (bar still 72 px, nav unchanged) | Founder brief |
| 2026-10-22 | Work stayed on `dev`, not a new branch: the brief asked for one, the standing two-branch rule wins | Founder rule |
| 2026-10-22 | Client showcase built (not a duplicate of Results: Results has one headline metric per client in stacking cards; the showcase has up to six metrics per card). Empty cards hidden on the live site | Brief 5.7 |
| 2026-10-22 | Client logos: 17 files downloaded once from the live page into `scripts/seed-assets/brands/`, uploaded by `npm run seed:logos` to `rohtre-media/images/brands/{slug}` (code defaults reference these ids, like the badges). 16 identified, 1 unidentified (stored switched off). Logos are shown unmodified (testimonials and client cards put them on a dark chip) | Brief Part 7 |
| 2026-10-22 | Platform logos (Shopify, Meta, Google, YouTube) not added: no official files supplied; Who We Serve cards show our icons until the founder uploads official files | Brief 7.1 |
| 2026-10-22 | Round 2 (visual fixes + showcase slider) also stayed on `dev`: the brief asked for a new branch, the two-branch rule wins | Founder rule |
| 2026-10-22 | Official Shopify bag (Shopify brand-assets zip) and Meta mono-white lockup (Meta brand resources zip) committed unmodified in `public/brand/platforms/`; used only as "platforms we work with" (Who We Serve icon, hero illustration). Sources in `docs/seed-manifest.md` | Brief C1, C2 |
| 2026-10-22 | Hero default = composition with the coded magnet illustration (passed a static render check; no people, no photos). The slider layout and its fields are kept (`hero.mode`). Composition drops the subline and the WhatsApp button (the floating WhatsApp button stays) | Brief C1 |
| 2026-10-22 | Hero visual uploads: PNG/WebP/AVIF with transparency. SVG uploads stay refused (an uploaded SVG can carry script) | Security |
| 2026-10-22 | Product mockups from the live carousel seeded as the product slots (9:16, alt "Product placeholder image"); client-showcase names and numbers from the live page's counters (Rama Chikan, Harmiche) | Brief C3, C7 |
| 2026-10-22 | FAQ approval became an admin-only flag; pills removed from the page in every environment; unapproved answers are launch blockers (landing-page FAQs keep `status` and map it to the same rendering) | Brief C8 |
| 2026-10-22 | Carousel and count-up written by hand (no new dependency); home first-load JS 185.1 → 186.5 KB gzip | Brief Part 0.4, 0.7 |
| 2026-10-22 | Round 3 (phone frames, Video Ads, red partner strip, CTA objects, admin layout) stayed on `dev`: the brief asked for a new branch, the two-branch rule wins | Founder rule |
| 2026-10-22 | Phone screens: shapes 9:19.5 (default) / 9:16 / 9:18 + Fill/Fit; section size control for phones and Video Ads; all sizes in `layout-presets.ts`. Old phone shapes upgraded on read (no SQL) | Brief P2, P3 |
| 2026-10-22 | Partner strip = red band (`--brand`, white 5.5:1, no darker token needed); `badges.logo_style` (additive migration) | Brief P1 |
| 2026-10-22 | Home CTA card: 16 objects with pointer drift; hand-written (no dependency); home first-load JS 186.5 → 187.7 KB gzip | Brief P4 |
| 2026-10-22 | Admin: new navigation, home editor rail, compact lists, plain labels, shared save bar; presentation only (same fields, keys, save calls, roles) | Brief P5 |
| 2026-10-22 | Round 4 (themed dropdowns, landscape shapes, Video Ads stage + icon row, Founder stat, footer social icons) stayed on `dev`: the brief asked for a new branch, the two-branch rule wins | Founder rule |
| 2026-10-22 | Video Ads = stage of 3 frames (phone / monitor / phone) + icon row, replacing the 4 phone cards; old `items` kept in the data, deprecated | Brief Q3 |
| 2026-10-22 | Hero video: landscape shapes; taller shapes are capped at today's 16:9 height on desktop so the headline and button never move | Brief Q2 |
| 2026-10-22 | Dev dependency `jsdom` (tests only): the admin Select's keyboard/focus/portal tests need a DOM. Simple Icons copied as path data (not installed) | Brief Part 0.3 |
| 2026-10-22 | Home first-load JS 187.7 → 188.0 KB gzip (round 4); the Select is admin-only | Brief Part 0.6 |
| 2026-10-23 | **Phase 5 (AI) dropped.** Remaining: Phase 6 (case studies, GTM/GA4/Pixel/CAPI + consent, SEO/performance) and Phase 7 (WordPress redirects, domain switch, campaigns one at a time, uptime/backups), only on the founder's word | Founder |
| 2026-10-23 | About and Careers rebuilt from the live pages in the Home style; a careers block photo showing another company's staff was not reused (placeholders until the founder uploads) | Founder brief |
| 2026-10-23 | Careers applications: Supabase + email to HR through Gmail SMTP (nodemailer, free app password). Resume attached to the email only, never stored. WhatsApp-to-HR (Cloud API) prepared but off (`CAREERS_WHATSAPP_ENABLED`). No tracking event on the careers form | Founder ("free") |
| 2026-10-24 | Contact: new contact-only form (landing pages keep `LeadForm`), saved in `leads`, sales email through the same Gmail SMTP with Reply-To = visitor, HTML (escaped) + text, inline logo (cid). `lead_submit` fires only after a confirmed save, unchanged | Founder |
| 2026-10-24 | Legal pages: new slugs named after the pages; live text copied word for word (typos and outdated WordPress cookie names kept, editable); the live opt-out and fraud report forms replaced by "Email us" buttons; cookie switches wait for Phase 6's banner | Founder |
| 2026-10-24 | Branches: briefs asked for feature branches; the two-branch rule (`dev` + `main`) won every time | Founder rule |
| 2026-10-24 | Claude doesn't run lint, build, typecheck, tests or the dev server; the founder runs them | Founder |
| 2026-10-27 | Landing pages redrawn in the site's light theme (sky hero, white `.rm-svc` cards, sky form band, white frames); proof sections reuse the Home blocks. Owner publishes after switching on Settings → Publishing. Ad pages: Unlisted recommended | Founder |
| 2026-10-27 | Sharp corners site-wide for media frames and cards: `.rm-work-frame` reused for the Home hero video, About video and Careers images; Results cards, Home product cards, `PlaceholderBox` and the closing CTA card square (CtaPanel `band` prop matches the strip to the section above) | Founder |
| 2026-10-27 | Niches: 27 D2C niches/sub-niches (`20261027120000_more_niches`) + Lifestyle, Real estate, SaaS, Event management (`20261027130000_…`); "Health" = existing Health & wellness. Niche starter copy (hero line, pain points, 2 FAQs, form intro) in `src/sections/niche-copy.ts` (sub-niches use the parent's); every new page also gets a country FAQ (currency). Existing pages unchanged | Founder |
| 2026-10-26 | Work + Recognition from the live pages; only the 10 named brands (live grid also has italki, Teddy Blake, StoryLearning, SpeakBubbles, Load More: not built); live client-quotes carousel on /work not built; live "Learn more" (/contact-us) and "Hire us" (#) -> /contact; "Meet some of our colleagues" (#) -> /about#team [TO CONFIRM]; brands in a table (`work_brands`), pages in `page_content` | Founder brief |

## 8. Env var names (values only in `.env.local` / host settings)

| Name | Where | Used by |
|---|---|---|
| NEXT_PUBLIC_SITE_URL | browser | metadata base |
| NEXT_PUBLIC_SUPABASE_URL | browser | Supabase clients |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | browser | Supabase clients (RLS applies) |
| SUPABASE_SECRET_KEY | **server only** | `lib/supabase/admin.ts` (lead intake, publish) |
| NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME | browser | delivery URLs |
| CLOUDINARY_API_KEY | server | signed upload, delete |
| CLOUDINARY_API_SECRET | **server only** | signing (`lib/env.server.ts`, guarded by `server-only`) |
| LEADS_SHEET_WEBHOOK_URL | server | `lib/leads.server.ts` (optional Google Sheet copy) |
| LEADS_SHEET_SECRET | **server only** | shared secret with the Apps Script |
| ADMIN_LOGIN_PATH | server (build + proxy) | secret sign-in address, e.g. `/rohtre-…` (12-80 chars) |
| LEAD_HASH_SALT | **server only** | optional salt for IP hashing (falls back to the secret key) |
| SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD | terminal only | Supabase CLI (optional; the founder's CLI login is used) |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS | **server only** | Gmail SMTP (app password) for careers + contact emails |
| CAREERS_NOTIFY_FALLBACK | server | HR address when Admin → Careers → HR emails is empty |
| CONTACT_NOTIFY_EMAIL | server | sales address(es) for Contact enquiries; empty = CAREERS_NOTIFY_FALLBACK, then SMTP_USER |
| CAREERS_WHATSAPP_ENABLED, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_HR_NUMBER, WHATSAPP_TEMPLATE, WHATSAPP_TEMPLATE_LANG | **server only** | WhatsApp-to-HR (off) |

## 9. Phase checklist

| Phase | Status |
|---|---|
| Gate 0 plan | done 2026-10-17 |
| 0 Foundation | done 2026-10-17 |
| 1 Global shell | done 2026-10-17 |
| 2 Home page | done 2026-10-17 (redesigned, fixes 2026-10-21) |
| 3 Landing system | done 2026-10-21 |
| 4 Admin | done 2026-10-21 |
| Company pages: About, Careers (+ applications), Contact (+ sales email) | done 2026-10-23/24 |
| Legal pages (5) + admin Company/Legal menus | done 2026-10-24 |
| Work (+ 10 brand pages), Recognition, 6-link header, phone layout, Book a Call -> Contact fix | done 2026-10-26 (founder testing) |
| Landing theme, admin polish (loading, Live strip, Quick find, guide, switches, delete page), niches, mobile + motion polish | done 2026-10-27 (all 286 tests pass) |
| 5 AI | **dropped** (founder, 2026-10-23) |
| 6 Tracking (GTM, GA4, Google Ads conversions, Meta Pixel + CAPI) + consent banner, SEO hardening, performance pass · 7 Launch | not started; wait for the founder. Case studies = the 10 brand pages (no separate section); blog dropped |

## 9a. Launch blockers

| Item | What's owed | Where |
|---|---|---|
| Legal pages: copied from the live site; review outdated text (WordPress cookie names, "form below" on Do Not Sell, "Your choices are saved" on Cookie Settings, IPC → BNS) and have them reviewed before launch | founder | Admin → Legal |
| Careers: 3 block photos (4:3) | founder | Admin → Careers page → Image + text blocks |
| Delete the old Avjit and Hassan photos in Cloudinary | founder | Cloudinary |
| Real sales address for Contact enquiries (`CONTACT_NOTIFY_EMAIL`) | founder | `.env.local` / host |
| Work/brands: live numbers that look copy-pasted (KSI +80K Brand Credibility, BetterHelp +700M Audience engagement, Law Care +₹33K Modern Identity, same 80K/160/700 on EA, TFV, RiceKraft, OhMyGoal; PedTalks +136K vs text 138,000); typos kept (NEIL GUIDES, PetTalk, RohanTre); SEO descriptions are WordPress auto-excerpts (Work/Recognition contain "+ 0 clients"): rewrite | founder | Admin -> Work page / Recognition page |
| Work: upload the 2 videos (live: new-render-rakhi.mp4, higgsfield v720p.mp4 on videos.files.wordpress.com); low-res images: ICCMRT slide 400x180, PedTalks banner, OhMyGoal; live logos are white-on-black squares (upload dark-on-transparent for a clean white tile); Pedram has no photo | founder | Admin |
| Host env: SMTP_* (+ CONTACT_NOTIFY_EMAIL) on the hosting | founder | Phase 7 |
| Apply `20261027120000_more_niches` and `20261027130000_niches_lifestyle_realestate_saas_events` (`npx supabase db push`) | founder | terminal |
| "2B+" stat badge (disabled): exact number, unit (conversions / views / other), "as of" date, proof source. Conflict: live home says 2 Billion conversions, live About says 2B views, the brief says 2,000,000+ conversions (1,000x and metric differ) | founder | `badges` row `e474c465…` |
| 5 live badges have no proof link (shown as a showcase by founder decision) | founder (optional) | `badges` |
| Home placeholders (dev only, never in production): 2 hero slides, 3 result blocks, founder years of experience | founder | home |
| Home media slots, all empty (neutral frames on the live site): hero 2 slides × desktop + mobile, 5 product slots, 2 phone videos, 4 video-ad cards, 2 client-showcase cards (+ client names, logos, numbers). Live list: Admin → Home page → Launch blockers | founder | Admin → Home page |
| Platform logos for Who We Serve (official Shopify, Meta, Google files), optional | founder | Admin → Home page → Who we serve |
| Unidentified client logo (`scripts/seed-assets/brands/unidentified-1.png`: brown round "b" mark) and the Harmiche.com testimonial logo | founder | Admin → Home page → Brands; Proof → Testimonials |
| Run `npm run seed:logos` (uploads the client logos) and apply migration `20261022120000_testimonial_logos` | founder | terminal |
| 5 testimonials need written permission; 6 FAQ answers need approval (each unapproved one is listed in Admin → Home page → Launch blockers; they never show on the live site until approved) | founder | `testimonials`, Admin → Home page → FAQ |
| Client showcase: period and source for Rama Chikan and Harmiche (numbers are live, but without "Last N days" and "Meta Ads"-style context); 2 posters (1:1) | founder | Admin → Home page → Client showcase |
| Empty media after round 2: hero video (16:9), 2 phone videos, 4 video-ad frames, 2 showcase posters | founder | Admin → Home page |
| Run `npm run seed:home` (uploads the 5 product mockups; fills a saved home copy if one exists). Until it runs, the product cards show broken images | founder | terminal |
| Apply migration `20261022150000_badge_logo_style` (`npx supabase db push`); until then saving a badge in the admin asks for it | founder | terminal |
| Video Ads: 3 empty screens (Left phone 9:19.5, Centre screen 16:9, Right phone 9:19.5); the old 4 cards no longer count | founder | Admin → Home page → Video ads & reels |
| Social links: all empty (the live footer shows no icons until a shown https link is saved) | founder | Admin → Settings → Social links |
| Google Partner badge: Google asks for the official HTML snippet, unaltered, ≥ 100 px tall; the strip shows the file at 56-88 px. Decide: keep, swap for the snippet, or drop | founder | Proof & badges |

Placeholder mechanism: `<Placeholder>` in `src/components/page-parts.tsx` renders "[TO CONFIRM: …]" (no longer used by the legal pages); home uses `PlaceholderBox` / `NotLiveTag` (`src/components/home/parts.tsx`) behind `SHOW_PLACEHOLDERS` (dev only).

## 10. Open items

| Item | Owner | Blocking? |
|---|---|---|
| **Free hosting.** Vercel Hobby forbids commercial use (verified). Cache Components need Node.js; Cloudflare/OpenNext doesn't support Node proxy yet. Options to check: Cloudflare Workers (drop proxy, use its free AI-bot block), a free Node VM, Netlify Free (terms unverified) | developer + founder | Phase 7 (launch) |
| Supabase Free pauses after 1 week of inactivity and has no backups. Plan: weekly keep-alive + nightly `pg_dump` via free GitHub Actions (allowed? unverified) | developer | before launch |
| One Supabase project for dev and live risks test data in live. Recommend 2 free projects (dev + live) | founder | before launch |
| First-load JS (gzipped): `/` 183 KB (without slides), `/contact` 184 KB, `/login` 250 KB (Supabase auth client). The framework alone is about 175 KB, almost all framework (Next 16 + React 19); our code is under 5 KB. The 120 KB budget isn't reachable with the App Router. Proposal: budget = framework + 30 KB of our code | founder | Phase 6 budget |
| Restoring an old page version whose image was since deleted from the Media library shows a missing image until a new one is chosen | founder | no |
| Live-site claims without proof (`docs/content/wordpress-inventory.md`) | founder | publishing |
| Set up the Google Sheet link (`docs/setup/google-sheets-leads.md`) | founder | no (leads are safe in Supabase) |
| Legal pages now carry the live site's own text (no placeholders); have them reviewed before launch | founder | launch |
| Lead route end-to-end (HTTP) test and browser screenshots not run: the founder runs the site; the database part is covered by `check:rls` | developer | no |
| 2026-10-21: the only login (founder) had no `profiles` row ("no access"); an active **owner** profile was added. Name is empty: set it on Admin → Users | founder | no |
| Home inputs: 2 hero slides (desktop + mobile), which testimonials are real + approved, real results (client, metric, screenshot), FAQ approval, founder years of experience: all through the admin (Home page, Proof & badges) | founder | publishing |
| Admin screens were checked by typecheck, lint, unit tests, RLS checks and a production build only; the founder runs the site, so nobody has clicked through them in a browser yet | founder | no |
| "2B+" conflict: conversions (home) vs views (About) vs 2,000,000+ conversions (brief) | founder | that badge |
| Keys were pasted in chat (also a full `.env.local` copy on 2026-10-23): rotate the Supabase secret key, Cloudinary API secret, Gmail app password and `ADMIN_LOGIN_PATH`; delete the uploaded copy | founder | before launch |
| Gmail SMTP limit about 500 emails/day (consumer account); if the account is flagged both forms stop emailing (rows are still saved, failure shown in the inbox) | founder | no |
| Not seen in a browser by Claude: About, Careers, Contact, legal pages and their admin editors (the founder checks manually) | founder | no |
| "2B+" badge is switched ON in the database (seen 2026-10-22) although its number/unit is unconfirmed; it shows on the live strip | founder | that badge |
| Client-logo use: big-brand logos (EA, DayZ, BetterHelp, italki, Sidemen, SPORTbible…) imply they were clients; confirm each, with permission where needed | founder | before launch |
| Optional home sections from the live page not built: Paid media & PPC swipe carousel, One Growth System, News & Recognition | founder | no |
| Results section slots are image-only (pending migration to media slots, needs approval) | founder | no |
| Home redesign not checked in a browser (founder runs the site): mobile LCP/CLS before/after not measured; first-load JS `/` 184.1 → 185.1 KB gzip (round 1) → 186.5 KB (round 2) | founder | no |
| Round 2 not seen in a browser either: only the hero illustration was rendered on its own (static, headless Chrome). Check 1920, 1366, 1280 and 390 px | founder | no |
| Results media as image-or-video slot: needs an additive `results` migration plus a change to its "approved needs an image" check; not done | founder | no |
| Hero visual: `hero.visual = illustration` by default; switch to `media` after uploading your own transparent image | founder | no |
| Round 3 seen only as static renders of the changed sections (headless Chrome, built CSS, fallback font because the web font didn't load from file://), not in the running site; mobile LCP/CLS not measured | founder | no |
| `design.css` defines `@keyframes rm-float` twice (hero magnet + CTA squiggles); the later one wins, so the magnet floats with the simple up/down keyframes instead of its own. Found 2026-10-22, not changed (hero not in scope) | founder | no |
| Round 4 seen only as static renders (headless Chrome, built CSS, fallback font) of the Video Ads section, hero shapes, Founder stat, footer and an open dropdown at 1920/1440/1366/1280/1024/768/390 and zoom 50/67/125/200% (Video Ads); not in the running site; mobile LCP/CLS not measured | founder | no |
| Video Ads migration checked in code and tests, not against the saved row (hosted Supabase not touched); per the last record the 4 cards were empty, so nothing should move | founder | no |
| Badge logo files are small (Google 151×110, Meta 151×60, Microsoft 159×60): at 68-88 px tall Meta and Microsoft are upscaled and may look soft; larger official files would be sharper | founder | no |

## 10a. Phase 3 not done (needs founder input or later phases)

- Booking widget in the visitor's time zone (R7): booking tool not chosen yet; Book a Call goes to the on-page form.
- Country phone numbers per landing page: phones live in global settings (IN, US); per-country display on landing pages arrives with country-specific contact blocks in Phase 4.
- Custom HTML section (R26) and AI-crawler block list (R42 d): done in Phase 4. Publishing from the admin refreshes the page instantly (`updateTag`).

## 11. Next step

**All public pages and the landing system are built on `dev` (2026-10-27).** 2026-10-27 work (landing theme, admin polish, niches, sharp frames, motion, mobile buttons) passes typecheck/lint/tests (286); the founder runs the build, then says "commit and push" (dev -> GitHub; main only when the site is finished). Two niche migrations to apply. After new routes run `npx next typegen`.
Next (founder's word): Phase 6 = tracking + consent banner (needs GTM ID, GA4 ID, Ads conversion ID/label, Meta Pixel ID + CAPI token), SEO hardening (rewrite auto-excerpt descriptions, share images, Search Console), performance (Lighthouse mobile). Phase 7 = hosting choice (Vercel Hobby forbids commercial use), domain switch, WordPress redirect map (needs the URL export), uptime + backups, launch checklist.

Admin sign-in: secret address in `.env.local` (`ADMIN_LOGIN_PATH`); founder's account is owner.
