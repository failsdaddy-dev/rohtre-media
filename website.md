# RohTre Media website - project memory

Read this first in every session; don't re-scan the codebase. No secrets here, ever.
Contract: `docs/claude-build-prompt.md` (R1-R45). Gate 0 plan: `docs/gate-0-plan.md`. Old site content: `docs/content/`.

## 1. Site map

| Path | Kind | Visibility | Status |
|---|---|---|---|
| `/` | home page (R13): dark hero + slider, badge bar, services (dark), results (stacking), process (dark timeline), testimonials (marquee), founder (dark, quote reveal), FAQ, CTA panel | public | built (Phase 2, redesigned) |
| `/about` | founder, values, team (photos in Cloudinary `rohtre-media/images/team/*`) | public | built (Phase 1) |
| `/careers` | values, spotlights, hiring steps, FAQ, Chat with HR | public | built (Phase 1) |
| `/contact` | lead form `#enquiry` + contact details | public | built (Phase 1) |
| `/privacy`, `/terms` | legal (DPDP-based); company name/type/address, privacy contact and jurisdiction city come from Settings → Legal details, shown as placeholders while empty | public | built (Phase 1, wired to settings Phase 4) |
| `/login`, `/no-access`, `/auth/signout` | sign-in (vault look). With `ADMIN_LOGIN_PATH` set, the sign-in page is only at that secret address (rewrite in `next.config.ts`); `/login` and signed-out `/admin/*` answer 404 (`src/proxy.ts`, `src/lib/login-path.ts`). Unset = plain `/login` | private | built (Phase 1, secret address 2026-10-21) |
| `/admin` | overview + latest 20 leads (owner/developer) | private | built (Phase 1) |
| `/admin/pages`, `/admin/pages/[id]` | landing pages: create (service × niche × country), section editor (text, images, on/off, reorder, variants, custom HTML), save draft, publish check, publish/unpublish (developer, or owner if allowed), visibility, preview link (7 days), versions + restore, duplicate for another country | private (all staff; publish = developer) | built (Phase 4) |
| `/admin/home` | home page text/images editor (`page_content` key `home`) | private | built (Phase 4) |
| `/admin/proof` | results, testimonials, creatives, concept work, badges: edit, approve, tag to service/niche/country | private | built (Phase 4) |
| `/admin/media` | Cloudinary library: upload, see where used, delete (only when unused; also deletes from Cloudinary) | private | built (Phase 4) |
| `/admin/leads`, `/admin/leads/export` | lead list: search, status, delete on request (audited), purge older than retention, CSV export (formula-safe) | owner/developer | built (Phase 4) |
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

Public pages live in two route groups that both render `SiteChrome` (header, footer, WhatsApp button); the group sets the header tone (see section 5a):
- `src/app/(dark-hero)/`: `/`, `/about`, `/careers`, `/contact` (first screen is a dark hero) → `transparent-light-text`.
- `src/app/(site)/`: `/privacy`, `/terms` and **any new page by default** → `solid`. Root `not-found.tsx` → `solid`.
Header menu: Home, About, Careers, Contact + Book a Call (`/contact#enquiry`). No theme toggle. Services/Work links are added once those pages exist.

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
- Settings JSON gained `legal` {companyName, companyType, registeredAddress, privacyContactName, privacyEmail, jurisdictionCity} and `aiBots` (Phase 4; no migration, Zod defaults).

## 3. Section library

Home page sections (Phase 2, `src/components/home/`), content in `src/content/home-schema.ts`:

| Section | Fields | Variants |
|---|---|---|
| hero | eyebrow, h1, h1Accent, subline, ctaLabel, slides[2] {desktop, mobile media, alt, href} | – |
| badges | enabled, eyebrow, cta (items from `badges` table) | – |
| services | eyebrow, title, accent, intro, items[] {title, text, icon, tags[], href}, cta | – |
| results | eyebrow, title, accent, intro, cta (items from `results`) | – |
| process | eyebrow, title, accent, intro, steps[1-5], cta | – |
| testimonials | eyebrow, title, accent, variant, cta (items from `testimonials`) | grid, slider (marquee) |
| founder | eyebrow, quote (live-site CEO quote), name, role, bio, yearsExperience (null until confirmed), photo, ctaLabel | – |
| faq | eyebrow, title, accent, items[] {q, a, status draft/ready}, cta | – |
| finalCta | eyebrow, title, accent, text, label | – |

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
- Hero: full-screen `.rm-beams` (drifting light beams drawn in CSS + red glow), pill label, two-tone H1, Book a Call + WhatsApp; the 2-slide slider below in a framed card.
- Cards: `.rm-glow-card` (black square; hover = 4-corner red/white gradient border + blurred bloom) on dark; `.rm-card` (white, soft shadow, lift on hover) on light.
- Results: `.rm-stack` sticky stacking cards (white / red / black). `.rm-stripe-band`: "ROHTRE MEDIA" in moving red/off-white stripes. Testimonials: `.rm-marquee` two rows, opposite directions, pause on hover. FAQ: `.rm-faq` details with smooth height. Final CTA: dark `CtaPanel` with dots, squiggles, quarter circles.
- All motion off for prefers-reduced-motion.

## 5a. Header tone (`src/lib/header-tone.ts`)

- `HeaderTone` = `"solid"` (default) | `"transparent-dark-text"` | `"transparent-light-text"`. In every tone the scrolled header is the same white bar with dark logo and links (unchanged).
- Set on the server: the route-group layout passes `tone` (from `GROUP_TONES`) to `SiteChrome` → `SiteHeader`, which writes `data-tone` on `<header>`; CSS in `design.css` styles `html:not([data-scrolled]) .rm-header[data-tone=…]`. First paint is correct (no flash, no layout shift). `resolveHeaderTone()` turns anything missing/unknown into `solid`, so forgetting a tone is harmless.
- Never style the header from other page content (`body:has(...)`): with Cache Components, pages you navigated away from stay in the DOM hidden (React Activity), which is what made the header white on Privacy/Terms (fixed 2026-10-21).
- Where each page declares its tone: `(dark-hero)/layout.tsx` → `transparent-light-text` (home, About, Careers, Contact); `(site)/layout.tsx` → none → `solid` (Privacy, Terms, new pages); `not-found.tsx` → `solid`.
- **Phase 3 hook:** every hero/section type in the future section registry declares the header tone it needs, and a page takes its header tone from its first enabled section; if none declares one the default is solid. The registry reuses the exported `HeaderTone` type.
- Test: `tests/header-tone.test.ts` (every public page is in a group with a valid tone; dark-hero pages and only those get white text).

## 5b. Badge render rule (`src/lib/proof.ts` → `publicBadges`)

A badge renders on the public strip only if `enabled` is true, in every environment (dev included), applied in both the data query (`getBadges`, public client) and the `BadgeBar` component. Disabled badges never render; there is no dev preview of them on public pages. The strip has one column per visible badge from 768 px up; on phones 2 columns with an odd last badge spanning the row.
Open decision: the 2026-10-21 fix request asked for "enabled AND proof AND not placeholder"; with today's data that hides all 5 badges (none has `proof_url`; no proof-note or placeholder field exists), which contradicts the founder's 2026-10-17 showcase decision. Kept the showcase rule until the founder decides.

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
| 2026-10-21 | **No 2FA**: admin sign-in is email + password only (2FA screens and checks removed after Phase 4). R22 "offer 2FA" declined | Founder |
| 2026-10-21 | New staff get a random 20-character one-time password shown once to the owner (no email service needed); they change it on the Password tab | R22, no paid services |
| 2026-10-21 | Media delete: only files uploaded through the admin, only when nothing uses them (pages, home content, proof). No trash folder | Founder (delete from Cloudinary) |
| 2026-10-21 | Confirmations in the admin are two-click buttons, never browser dialogs | R44 |

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

## 9. Phase checklist

| Phase | Status |
|---|---|
| Gate 0 plan | done 2026-10-17 |
| 0 Foundation | done 2026-10-17 |
| 1 Global shell | done 2026-10-17 |
| 2 Home page | done 2026-10-17 (redesigned, fixes 2026-10-21) |
| 3 Landing system | done 2026-10-21 |
| 4 Admin | **done 2026-10-21**, waiting for "go" |
| 5 AI (needs `docs/design-guide.md`) · 6 Blog/growth · 7 Launch | not started |

## 9a. Launch blockers

| Item | What's owed | Where |
|---|---|---|
| Legal details: company name, type, registered address, privacy contact name + email, jurisdiction city | founder | Admin → Settings → Legal details |
| "2B+" stat badge (disabled): exact number, unit (conversions / views / other), "as of" date, proof source. Conflict: live home says 2 Billion conversions, live About says 2B views, the brief says 2,000,000+ conversions (1,000x and metric differ) | founder | `badges` row `e474c465…` |
| 5 live badges have no proof link (shown as a showcase by founder decision) | founder (optional) | `badges` |
| Home placeholders (dev only, never in production): 2 hero slides, 3 result blocks, founder years of experience | founder | home |
| 5 testimonials need written permission; 6 FAQ answers need approval | founder | `testimonials`, home FAQ |

Placeholder mechanism: `<Placeholder>` in `src/components/page-parts.tsx` renders "[TO CONFIRM: …]" (legal pages); home uses `PlaceholderBox` / `NotLiveTag` (`src/components/home/parts.tsx`) behind `SHOW_PLACEHOLDERS` (dev only).

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
| Privacy/Terms placeholders: registered company name and type/address, grievance contact, jurisdiction city. Have both reviewed before launch | founder | launch |
| Lead route end-to-end (HTTP) test and browser screenshots not run: the founder runs the site; the database part is covered by `check:rls` | developer | no |
| Owner profile name was set to "Rohan Trehan" for the existing admin login: confirm | founder | no |
| Home inputs: 2 hero slides (desktop + mobile), which testimonials are real + approved, real results (client, metric, screenshot), FAQ approval, founder years of experience: all through the admin (Home page, Proof & badges) | founder | publishing |
| Admin screens were checked by typecheck, lint, unit tests, RLS checks and a production build only; the founder runs the site, so nobody has clicked through them in a browser yet | founder | no |
| "2B+" conflict: conversions (home) vs views (About) vs 2,000,000+ conversions (brief) | founder | that badge |
| Keys were pasted in chat: rotate the Supabase secret key and Cloudinary API secret before launch | founder | before launch |

## 10a. Phase 3 not done (needs founder input or later phases)

- Booking widget in the visitor's time zone (R7): booking tool not chosen yet; Book a Call goes to the on-page form.
- Country phone numbers per landing page: phones live in global settings (IN, US); per-country display on landing pages arrives with country-specific contact blocks in Phase 4.
- Custom HTML section (R26) and AI-crawler block list (R42 d): done in Phase 4. Publishing from the admin refreshes the page instantly (`updateTag`).

## 11. Next step

Phase 4 done 2026-10-21 (commits on `dev`). Waiting for the founder's "go". Phase 5 (AI page creation, R29-R32) needs `docs/design-guide.md`; if it's missing, stop and ask.

Founder to try in the admin (`npm run dev`, then /login): add an editor on Users, edit and preview a landing page, fill Settings → Legal details.
