# RohTre Media website - project memory

Read this first in every session; don't re-scan the codebase. No secrets here, ever.
Contract: `docs/claude-build-prompt.md` (R1-R45). Gate 0 plan: `docs/gate-0-plan.md`. Old site content: `docs/content/`.

## 1. Site map

| Path | Kind | Visibility | Status |
|---|---|---|---|
| `/` | foundation preview (placeholder; real home in Phase 2) | noindex | built (Phase 0) |
| `/robots.txt` | generated from `src/lib/crawlers.ts` | public | built |
| `/api/cloudinary/sign` | signed upload (staff only) | private | built |
| `/lp/*` | landing pages | unlisted | Phase 3 (proxy + headers already active) |
| `/login`, `/admin/*` | admin | private | Phases 1 and 4 |
| `/about`, `/contact`, `/careers`, `/privacy`, `/terms` | content | public | Phase 1 |
| `/case-studies`, `/blog` | content | public | Phase 6 |

## 2. Data model

Built so far (`supabase/migrations/20261017120000_staff_roles.sql`):
- `profiles` (user_id -> auth.users, role `staff_role` = owner | developer | editor, full_name, active).
- `current_role_name()`: security-definer helper used by RLS policies.
- RLS: staff read their own row; the owner reads and manages all; anon has no access.

Planned (Gate 0 section 2.2): dimension_types/values (service tree, niches with sub-niches, countries), country_settings, pages, page_dimensions, page_versions (sections JSONB), preview_tokens, media, clients, case_studies, testimonials, results, creatives, concept_works (separate table), proof_tags, badges, page_badges, settings, leads, rate_limits, redirects, ad_mappings, audit_log.

## 3. Section library

None yet (Phase 3). Each type will have `src/sections/<type>/{schema,render,editor}.ts(x)` plus one registry entry.

## 4. URLs and slugs

- Landing pages: `/lp/{service}-{niche}-brands-{country}` (Gate 0 option B, default). Unique, editable; a slug change adds a 301.
- Everything under `/lp/` is unlisted by default.

## 5. Theme tokens (`src/app/globals.css`)

Light and dark values live in one `light-dark()` per token. `color-scheme` follows the system unless `<html data-theme>` is set by the toggle (saved in localStorage `rm-theme`; `src/lib/theme.ts` boot script prevents a flash).
Key pairs (light / dark): bg #ffffff / #0f0f0f · fg #0f0f0f / #f1f1f1 · fg-2 #606060 / #aaaaaa · brand #d4000f / #e50914 · focus #c4000f / #ff3b3b.
Styles copied from rohtre-vault with an `rm-` prefix: `.rm-press` (button lift on a red block), `.rm-offset` (card on a red offset block), `.rm-field`, `.rm-stripes`, `.rm-text-grad`, `.rm-hero-bg`, motion keyframes, reduced motion. Font: Space Grotesk via next/font (self-hosted).
Contrast: `tests/theme.test.ts` checks 9 text pairs (>= 4.5:1) and 3 UI pairs (>= 3:1) in both themes. All pass.

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
| 2026-10-17 | Supabase project `rqvugkcoohzpylbbwqlb` (free) and Cloudinary cloud `rx0ucmiq` (free) connected; keys only in `.env.local`, all three checked working | Founder |
| 2026-10-17 | Logo: wordmark from the founder, repainted black (light theme) and white (dark theme) in `public/brand`; favicon = the R mark, transparent SVG (`src/app/icon.svg`) that is black on light browser tabs and white on dark ones; `apple-icon.png` is a white R on dark because Apple needs an opaque icon. Sources and extra versions (red R) in `docs/brand` | Founder |
| 2026-10-17 | Social links are placeholders (`src/lib/site-defaults.ts`), hidden until real URLs are added | Founder |
| 2026-10-17 | Leads go to Google Sheets (Meta and Google Ads lead forms). Resend and Turnstile are not needed for now | Founder |

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

## 9. Phase checklist

| Phase | Status |
|---|---|
| Gate 0 plan | done 2026-10-17 |
| 0 Foundation | **done 2026-10-17**, waiting for "go" |
| 1 Global shell | next |
| 2 Home · 3 Landing system · 4 Admin · 5 AI · 6 Blog/growth · 7 Launch | not started |

## 10. Open items

| Item | Owner | Blocking? |
|---|---|---|
| **Free hosting.** Vercel Hobby forbids commercial use (verified). Cache Components need Node.js; Cloudflare/OpenNext doesn't support Node proxy yet. Options to check: Cloudflare Workers (drop proxy, use its free AI-bot block), a free Node VM, Netlify Free (terms unverified) | developer + founder | Phase 7 (launch) |
| Supabase Free pauses after 1 week of inactivity and has no backups. Plan: weekly keep-alive + nightly `pg_dump` via free GitHub Actions (allowed? unverified) | developer | before launch |
| One Supabase project for dev and live risks test data in live. Recommend 2 free projects (dev + live) | founder | Phase 1 |
| First-load JS on `/` is **175 KB gzipped**, almost all framework (Next 16 + React 19); our code is under 5 KB. The 120 KB budget isn't reachable with the App Router. Proposal: budget = framework + 30 KB of our code | founder | Phase 6 budget |
| Cloudinary delete vs. version history: deleting an image breaks rollback to versions that used it. Proposal: unreferenced images go to a 30-day trash, then are deleted | founder | Phase 4 |
| Is TOTP 2FA available on Supabase Free? The local config comment says MFA is Pro (unverified) | developer | Phase 4 |
| Live-site claims without proof (`docs/content/wordpress-inventory.md`) | founder | publishing |
| Website contact form: also send to Google Sheets? Default: save in Supabase (R10) **and** add a row to your sheet through a Google Apps Script link; spam protection = hidden honeypot field + time check + rate limit (no Turnstile) | founder | Phase 1 |
| Hosted Supabase still allows public sign-up: turn off in Dashboard -> Authentication -> Sign In / Providers -> "Allow new users to sign up" | founder | Phase 1 |
| Keys were pasted in chat: rotate the Supabase secret key and Cloudinary API secret before launch | founder | before launch |
| Screenshots at 1440/390 px not taken (browser screenshot timed out); checked with computed styles instead | developer | no |

## 11. Next step

Phase 1 (global shell): header/footer, WhatsApp button, global settings, /login (vault look), lead form + email alerts, Privacy, Terms, Careers, About. Keys are in `.env.local`. Still needed: OK to apply the roles migration to Supabase and to make the existing user the owner.
