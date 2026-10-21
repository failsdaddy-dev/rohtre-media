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
| `/privacy`, `/terms` | legal (DPDP-based), **3 placeholders** to fill | public | built (Phase 1) |
| `/login`, `/no-access`, `/auth/signout` | sign-in (vault look) | private | built (Phase 1) |
| `/admin` | overview + latest 20 leads (owner/developer) | private | built (Phase 1) |
| `/admin/settings` | global settings editor (owner/developer) | private | built (Phase 1) |
| `/api/leads` | the one lead route | private | built (Phase 1) |
| `/api/cloudinary/sign` | signed upload (staff only) | private | built (Phase 0) |
| `/robots.txt` | generated from `src/lib/crawlers.ts` | public | built |
| `/lp/*` | landing pages | unlisted | Phase 3 (proxy + headers already active) |
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
- RLS check: `npm run check:rls` (19 checks against the live project; creates and removes a temporary editor).

Planned (Gate 0 section 2.2): dimension_types/values, country_settings, pages, page_dimensions, page_versions, preview_tokens, media, clients, case_studies, testimonials, results, creatives, concept_works, proof_tags, badges, page_badges, redirects, ad_mappings, audit_log.

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

Phase 3 turns these into the general section registry (`src/sections/<type>/`).

## 4. URLs and slugs

- Landing pages: `/lp/{service}-{niche}-brands-{country}` (Gate 0 option B, default). Unique, editable; a slug change adds a 301.
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

- robots.txt: `*` allowed except /admin /login /preview /api. 17 AI tokens disallowed from `/lp/`. AdsBot-Google, AdsBot-Google-Mobile, facebookexternalhit and meta-externalads have their own allow group (AdsBot ignores `*`).
- `src/proxy.ts`: AI user agents get 403 on `/lp/*`; ad bots always pass. It also gates `/admin`.
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
| 2026-10-21 | Git: only `dev` (all work) and `main` (whole code when the site is done; starts at the Phase 0 commit). No phase/fix branches | Founder |
| 2026-10-21 | Header tone system (solid default) set per route group on the server; `body:has(.rm-hero-dark)` removed (it matched hidden previous pages) | Fix request |
| 2026-10-21 | Disabled badges never render, dev included; strip columns follow the visible count | Fix request |
| 2026-10-17 | Lenis added as a dependency (smooth scrolling the founder asked for; about 4 KB, lazy) | R35 rule 8 |
| 2026-10-17 | Home sections end with their own centred CTA (button + small line) instead of a separate strip; final CTA is the dark `CtaPanel` with Book a Call + WhatsApp | R13 |
| 2026-10-17 | Home services: the 9 agency services (Gate 0 default); no service pages yet, so cards don't link | Gate 0 Q2 |

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
| LEAD_HASH_SALT | **server only** | optional salt for IP hashing (falls back to the secret key) |
| SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD | terminal only | Supabase CLI (optional; the founder's CLI login is used) |

## 9. Phase checklist

| Phase | Status |
|---|---|
| Gate 0 plan | done 2026-10-17 |
| 0 Foundation | done 2026-10-17 |
| 1 Global shell | done 2026-10-17 |
| 2 Home page | **done 2026-10-17, redesigned**, waiting for the founder's review |
| 3 Landing system (next) · 4 Admin · 5 AI · 6 Blog/growth · 7 Launch | not started |

## 9a. Launch blockers

| Item | What's owed | Where |
|---|---|---|
| Privacy: registered company name and type | founder | `src/app/(site)/privacy/page.tsx` |
| Privacy: name and email of the person handling privacy requests | founder | same |
| Terms: registered company name and address | founder | `src/app/(site)/terms/page.tsx` |
| Terms: city for court jurisdiction | founder | same |
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
| Cloudinary delete vs. version history: deleting an image breaks rollback to versions that used it. Proposal: unreferenced images go to a 30-day trash, then are deleted | founder | Phase 4 |
| Is TOTP 2FA available on Supabase Free? The local config comment says MFA is Pro (unverified) | developer | Phase 4 |
| Live-site claims without proof (`docs/content/wordpress-inventory.md`) | founder | publishing |
| Set up the Google Sheet link (`docs/setup/google-sheets-leads.md`) | founder | no (leads are safe in Supabase) |
| Privacy/Terms placeholders: registered company name and type/address, grievance contact, jurisdiction city. Have both reviewed before launch | founder | launch |
| Lead route end-to-end (HTTP) test and browser screenshots not run: the founder runs the site; the database part is covered by `check:rls` | developer | no |
| Owner profile name was set to "Rohan Trehan" for the existing admin login: confirm | founder | no |
| Home inputs: 2 hero slides (desktop + mobile), which testimonials are real + approved, real results (client, metric, screenshot), FAQ approval, founder years of experience. Until the admin (Phase 4) can do it, the developer flips approvals in the database on request | founder | publishing |
| "2B+" conflict: conversions (home) vs views (About) vs 2,000,000+ conversions (brief) | founder | that badge |
| Keys were pasted in chat: rotate the Supabase secret key and Cloudinary API secret before launch | founder | before launch |

## 11. Next step

**Paused 2026-10-17; founder back Wednesday.** Before Phase 3: founder reviews the redesign on a phone (not yet checked at 390 px) and replies "go"; still open: "2B+" = conversions or views?

Phase 3 (landing system, R1-R7, R15-R21, R25, R28, R42, R45): section registry with Zod schemas, master template, service x niche x country model, automatic slugs and headlines, per-page offer banner, results/creatives, concept work, proof tagging, country settings, page visibility with database-driven robots/sitemap, publish check, and 3 real pages (Meta ads x fashion, a D2C page, a USA page) built only from facts the founder supplies.
