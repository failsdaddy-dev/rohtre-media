# Gate 0 - Plan and questions (RohTre Media website)

Date: 2026-10-17. Status: **waiting for "approved"**. No code has been written.
Contract: `docs/claude-build-prompt.md`. `docs/blueprint.md` does not exist; the founder said "proceed without blueprint", so the build prompt is the only contract. Anything the blueprint would have answered is a question in section 4.

---

## 1. What I understood, and contradictions

**What we are building.** We are replacing WordPress with a Next.js + Supabase + Cloudinary site. Its main job is many landing pages, one per service x niche x country, each matching one ad group. Each page is an ordered list of sections stored in the database, built from one master template, and edited in /admin with no code. The site also has a home page, About, Case Studies, Contact, Careers, a blog generated from YouTube, and legal pages. It shares one header, footer, WhatsApp button and lead form. The look reuses RohTre Vault's red/white/black light/dark theme and its admin login. Landing pages are "unlisted": anyone with the link can open them, but they are kept out of search and away from AI crawlers. Ad crawlers stay allowed.

**Contradictions and how I propose to resolve them**

| # | Conflict | Proposed resolution |
|---|---|---|
| a | R7 says to format currency per country; R16 bans price UI. | Currency formatting applies only to result metrics (for example "INR 2.4 Cr revenue" or "$180k ad spend managed") inside proof blocks. No schema has a price, package or offer-amount field. Offers live only inside the banner image. |
| b | R19 keeps placeholder blocks in the layout; R25 blocks publishing while any placeholder exists. | Both hold: a placeholder shows in admin and preview with a striped "PLACEHOLDER - will not publish" overlay. The publish check **blocks** publishing while one is switched on. To publish anyway, the developer switches that block off, which makes it a disabled block rather than a placeholder. The renderer also drops placeholders as a second safety net. |
| c | "No developer needed for pages" vs. the phases. | Editing existing pages without a developer works from **Phase 4**. Creating a page (pick service/niche/country, auto slug and headline, fill sections) and "duplicate for another country" also arrive in Phase 4, without AI. Phase 5 only adds AI-written copy. **But** R24 makes publishing developer-only, so the founder still needs the developer to press Publish until the "founder can publish" setting is turned on. |
| d | R42 "unlisted", R36 "crawlable for ads" and R34 blog SEO. | Each page has its own visibility mode. Landing pages are unlisted: noindex, out of the sitemap, AI bots blocked, ad bots allowed. Blog, home and legal pages are public. One robots.txt serves all three needs (section 2.3). |
| e | R35 bans client-side fetching of page content; R7 wants booking times shown in the visitor's time zone. | The booking widget converts time zones itself and loads only when clicked. No page content is fetched in the browser. |
| f | Constraint 5 (real imagery only) and R20 (real work only) vs. R45 concept work. | Concept work is real imagery that RohTre made, so it is allowed. It always carries a label and is a separate data type that cannot attach to proof. |
| g | Constraint 3 needs local Supabase, which needs Docker. **Docker is not installed on this PC.** | Blocker. Question 17. |
| h | R22 asks to offer 2FA, but rohtre-vault removed 2FA (migration `remove_2fa`). | Supabase supports TOTP (verified, section 3). I recommend making it **required** for owner and developer and optional for editors (question 13). |

---

## 2. Architecture

### 2.1 R28 - hybrid section architecture (recommended)

1. **Section registry in code.** Each section type is a folder: `sections/<type>/schema.ts` (Zod: fields, `variant` enum with at most 2 values, `enabled`), `render.tsx` (a server component) and `editor.ts` (field metadata for the admin form). One registry file maps `type -> {schema, render, editor}`. The admin form, the publish check, the AI (Phase 5) and the renderer all read the same schema.
2. **A page is data.** A page version stores `sections: [{id, type, variant, enabled, props}]` as JSONB. It is validated by the registry on every save, so invalid data never reaches the database.
3. **One master template.** This is the default ordered section list for landing pages (2.5). A new page copies it, and editors switch sections on or off and reorder them.
4. **Uniqueness per page** comes from four sources: (i) every section's copy, images and FAQ are per page; (ii) each page has its own offer banner; (iii) proof is matched by tags (R18), so each page shows different case studies and creatives; (iv) the custom-HTML section (R26) handles one-off content, and the developer can register a new section type once for repeated needs.
5. **Cost of a new section type:** about 3 small files plus a registry line, one unit test of its schema, and one deploy. It then appears for every page in admin and the AI. It needs no database migration, because props are JSONB validated by Zod.

Why not separate templates per niche: each fork multiplies maintenance and breaks the "one form, one shell" rules. Why not a free-form page builder: it is slow to build, hard to validate, and hurts performance and the publish check.

### 2.2 Data model (Postgres, RLS on every table)

**Dimensions (R1, R2, R6, extensible)**
- `dimension_types` (key: `service` | `niche` | `country` | future types, label, sort). A new dimension is a row, not a rewrite.
- `dimension_values` (id, type_key, **parent_id** for hierarchy, slug, label, label_in_headline, attrs jsonb, sort, active). Services form a tree: `d2c-marketing` has channels {google, meta}, with children `d2c-meta-ads` {meta} and `d2c-google-ads` {google}. Sub-niches are children of niches (fashion > clothing, shoes, jewellery).
- `country_settings` (dimension_value_id, iso code, currency, locale, phone, whatsapp, default time zone, booking_url).

**Pages and content**
- `pages` (id, kind: home | landing | about | contact | careers | privacy | terms | case_study | blog_index | system, slug **unique**, visibility: public | unlisted | private, status: draft | published | archived, published_version_id, draft_version_id, headline_auto bool, created_by, timestamps).
- `page_dimensions` (page_id, dimension_value_id), unique per (page, type).
- `page_versions` (id, page_id, number, sections jsonb, meta jsonb {title, description, h1, canonical, og_image}, offer_banner {desktop, mobile, alt}, created_by, created_at, note). Rollback re-points `draft_version_id` to a copy of an older version.
- `preview_tokens` (token_hash, page_version_id, expires_at, created_by). Preview links are noindex and private.
- `media` (id, cloudinary public_id, resource_type, width, height, bytes, alt, folder, uploaded_by). Desktop and mobile crops are two media refs per slot.

**Proof (R18, R19, R45)**
- `clients` (name, logo media, website, is_real = true always; a fake client cannot exist because concept work has no client link).
- `case_studies`, `testimonials`, `results` (client_id, metric value + unit + currency, screenshot/mobile media, **is_placeholder**, status).
- `creatives` (client_id **required**, kind: image | reel, media, poster).
- `concept_works` (a separate table: media, kind, label_text). It has **no** client_id and no metric column, so it cannot be joined to proof.
- `proof_tags` (item_type, item_id, dimension_value_id). A page matches proof whose tags fit its dimensions; the admin shows "matched N items".
- `badges` (label, image, proof_url, last_verified_at, enabled, with CHECK `enabled -> proof_url is not null`) and `page_badges` (page_id, badge_id, sort).

**Operations**
- `settings` (one row: contacts, socials, per-country numbers, WhatsApp template, careers line on/off, founder_can_publish, lead_retention_days, ai_bot_blocklist[], ad_bot_allowlist[], concept label text).
- `leads` (page_id, page_path, name, phone, email, business_type, website, ad_spend_range, message, consent, consent_at, consent_text_version, utm_source/medium/campaign/term/content, gclid, fbclid, referrer, user_agent, ip_hash, country_guess).
- `rate_limits` (key, window_start, count). Rate limiting in Postgres means no extra service.
- `redirects` (from_path unique, to_path, status 301, auto bool, created_by).
- `ad_mappings` (platform, campaign, ad_group, keyword_theme, page_id, notes).
- `audit_log` (actor, action, entity, entity_id, diff jsonb, at). Insert-only; nobody can update or delete it.
- `profiles` (user_id, role: owner | developer | editor, active).
- Phase 5: `ai_runs` (user, prompt, output, tokens, cost). Phase 6: `youtube_videos`, `blog_posts`.

**RLS roles**

| Role | Can |
|---|---|
| anon | Read **published** versions of public/unlisted pages and the published proof/settings they use. Nothing else. No read or write on leads. |
| editor | Read everything except leads, audit and users; create and edit drafts; upload media. Cannot publish, change visibility or delete. |
| developer | Everything an editor can, plus publish, visibility, redirects, leads (read, export, delete), settings. |
| owner | Everything, plus users and roles; publish only when `founder_can_publish` is on. |

Leads are written only by the server route (secret key, after validation, spam check and rate limit). Publishing is a Postgres function that re-runs the publish check, so the API cannot bypass it.

### 2.3 URL pattern (R3) and visibility (R42)

| | Option A - nested | Option B - flat with prefix (recommended) |
|---|---|---|
| Example | `/lp/meta-ads/fashion/usa` | `/lp/meta-ads-fashion-brands-usa` |
| Good | The hierarchy is visible; easy to reason about. | Short; reads like the ad; free to edit; one segment. |
| Bad | Long; renaming a dimension changes many URLs; deep sub-niches get longer. | Generator must de-duplicate (adds `-2`). |

Both use the **`/lp/` prefix** for all landing pages. That gives robots.txt one simple rule (`Disallow: /lp/` for AI bots) without listing unlisted URLs, since listing them in robots.txt would publish them. The slug is generated as `{service}-{niche}[-brands]-{country}`, can always be edited, and is unique. Changing it creates a 301 automatically.

**robots.txt (generated):**
- `User-agent: *` - allow, except `/admin`, `/preview`, `/api`. Google sees noindex on unlisted pages because it is allowed to fetch them (verified: https://developers.google.com/search/docs/crawling-indexing/block-indexing).
- Named AI crawlers - `Disallow: /lp/` (and the whole site, if you choose). The tokens are listed below.
- `AdsBot-Google`, `AdsBot-Google-Mobile` - their own allow group. They **ignore `User-agent: *`**, so they must be named directly (verified: https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers). Destinations that Google Ads cannot crawl are disapproved (verified: https://support.google.com/adspolicy/answer/6368661).
- Meta `facebookexternalhit` and `meta-externalads` - allowed (verified: https://developers.facebook.com/docs/sharing/webmasters/web-crawlers).

**AI crawler tokens (verified)**
- OpenAI: GPTBot, OAI-SearchBot, ChatGPT-User. ChatGPT-User "may not" follow robots.txt. (https://developers.openai.com/api/docs/bots)
- Anthropic: ClaudeBot, Claude-User, Claude-SearchBot. All honour robots.txt. (https://support.claude.com/en/articles/8896518)
- Perplexity: PerplexityBot, Perplexity-User. Perplexity-User "generally ignores robots.txt". (https://docs.perplexity.ai/guides/bots)
- Google-Extended controls Gemini training/grounding only and does not affect Search. (https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers)
- Meta: meta-externalagent (AI training), meta-webindexer, meta-externalfetcher (user-triggered, may bypass robots.txt).
- Unverified: CCBot, Bytespider, Applebot-Extended, Amazonbot. I will check each in Phase 3.

**Second layer:** `proxy.ts` (Next 16's middleware) returns 403 to the AI-crawler block list on `/lp/*`, which also stops bots that ignore robots.txt but announce themselves.
**Honest limit:** bots that fake a browser user agent, and AI agents that run inside a real person's browser, cannot be stopped this way. Only `private` (login) hides a page.

### 2.4 Rendering and caching (R35)

- **Next.js 16.4.2** is the current release (verified: `npm view next version` on 2026-10-17). TypeScript strict, App Router.
- Public pages are rendered on the server and cached. Data loaders use `'use cache'` + `cacheTag('page:<id>')`. Pages not yet generated render on their first visit and are then cached. No page content is fetched in the browser.
- **Publish** is a server action that writes the new version, then calls `updateTag('page:<id>')`, so the next visit gets fresh content. Webhook-style callers use `revalidateTag(tag, { expire: 0 })`. The single-argument form is deprecated (verified: https://nextjs.org/docs/app/api-reference/functions/revalidateTag). A slug change also revalidates the old path, which now redirects.
- **Theme without flash:** a tiny inline script in `<head>` sets `data-theme` from the saved choice, or from the system setting. Pages stay static because the server never needs to know the theme. CSS also reacts to `prefers-color-scheme`, so visitors without JS get the right theme.
- **Images:** Cloudinary `f_auto,q_auto`, responsive widths via a custom `next/image` loader, so Cloudinary does the optimisation and Vercel image-optimisation fees are avoided. The first hero slide uses `priority`.
- **Hero slider:** no library. CSS scroll-snap plus about 1 KB of JS for dots and arrows; autoplay off for reduced-motion users. A library is not worth it for 2 slides.
- **JS budget:** 120 KB gzipped first load per landing page. The React 19 + Next runtime baseline is likely 85-100 KB (unverified; I will measure in Phase 0 and report). Interactive parts are small client islands: form, WhatsApp, theme toggle, slider. Booking, GTM and Pixel load later or on interaction.
- **Fonts:** Space Grotesk via `next/font`, self-hosted at build time (OFL licence, verified by the vault: https://github.com/google/fonts/blob/main/ofl/spacegrotesk/OFL.txt).
- **Core Web Vitals "Good"** is LCP <= 2.5 s, INP <= 200 ms and CLS <= 0.1, measured at the 75th percentile (verified: https://web.dev/articles/vitals).

### 2.5 Landing page order (R15) - recommended

1. Header
2. Hero: H1 + offer banner (desktop/mobile) + primary CTA
3. Trust badge strip
4. Pain points
5. Results/proof (2-3 dashboards)
6. Creatives (images, then reels) or a search-data angle (R21)
7. Mid CTA
8. Platforms
9. Testimonials
10. Process (optional, off by default)
11. FAQ
12. Form + "Looking for a job? See Careers"
13. Footer + floating WhatsApp

Proof comes before claims, and the form comes last with a CTA in the hero and in the middle. Concept work, if used, appears only inside the creatives section under its label.

---

## 3. Hosting, regions, plans, cost, DPDP

| Option | Commercial use on free tier | Runs Next 16 fully? | Verdict |
|---|---|---|---|
| **Vercel Pro** | Hobby is **non-commercial only**; commercial use needs Pro (verified: https://vercel.com/docs/limits/fair-use-guidelines). Pro is $20/month per developer seat and includes $20 of usage credit (verified: https://vercel.com/pricing). | Yes. Vercel builds Next.js; `'use cache'`, tags and proxy are native. | **Recommended.** Same host as rohtre-vault. |
| Cloudflare Workers (OpenNext) | Free tier exists. | Mostly: ISR works, but **Node middleware is not supported yet** and the free plan's Worker size limit is 3 MiB (verified: https://opennext.js.org/cloudflare). Cloudflare now pushes "vinext", which is in beta (verified: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/). | Cheaper, but there is a risk for proxy.ts (R42) and on-demand revalidation. Not recommended now. |
| Netlify | Free plan is labelled "Individual"; commercial terms are not stated on the pricing page (unverified). Pro is $20/month. | Via adapter (unverified for Next 16 features). | Not recommended. |

**Supabase region:** `ap-south-1` Mumbai exists (verified: https://supabase.com/docs/guides/platform/regions). Most leads and the team are in India. Pages are served from the CDN, so overseas visitors are not slowed down. The Vercel function region should match (Mumbai `bom1`, unverified). I will check this at Phase 0 setup.

**Supabase plan:** the free plan pauses after 1 week of inactivity and has no backups (verified: https://supabase.com/pricing). That is not acceptable for a lead database. Use **Pro, $25/month**: daily backups kept 7 days, no pausing.

**Cloudinary:** the free plan has 25 credits/month, where 1 credit = 1 GB storage **or** 1 GB bandwidth **or** 1,000 transformations, and allows 3 users (verified: https://cloudinary.com/pricing). Production use is allowed within the credits (verified: https://cloudinary.com/documentation/developer_onboarding_faq_free_plan). For an image-heavy site, reels (video bandwidth) will use credits fastest. Plus is $99/month ($89 billed yearly) for 225 credits. Start on Free, add a usage alert, and upgrade when needed.

**Monthly cost estimate (plain language)**
- Vercel Pro $20 + Supabase Pro $25 + Cloudinary Free $0 + Cal.com Free $0 + email (Resend free tier, unverified) $0 = **about $45/month (about INR 3,800)**.
- If video traffic grows: + Cloudinary Plus $99, so **about $145/month**.
- Phase 5 AI usage is billed per use; I will estimate it at Phase 5 with cost logging.
- The domain is already owned.

**DPDP (India)**
- The DPDP Rules 2025 were notified on 13/14 November 2025. Consent-manager rules apply about 12 months later (about November 2026). The main obligations (notice, consent, security, breach notification, retention, rights) apply about **18 months later (about 13 May 2027)**.
- Status: partly verified. Two secondary sources agree on the phases but differ by a day: https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified and https://tsaaro.com/dpdpa-compliance. The MeitY page returned 403, so the Gazette text is still unverified.
- Plan: build to the obligations now. That means a clear notice at the form, a consent checkbox that is not pre-ticked, a stored consent timestamp and text version, purpose-limited use, a retention setting with auto-delete, restricted lead access, a delete-on-request tool and a privacy page.

**Other checks**
- Supabase MFA supports TOTP and phone; AAL2 can be enforced with a restrictive RLS policy (verified: https://supabase.com/docs/guides/auth/auth-mfa).
- WCAG 2.2 is the current W3C Recommendation (12 Dec 2024; verified: https://www.w3.org/TR/WCAG22/).
- YouTube `captions.download` needs OAuth as someone who can edit the video and costs 200 quota units. That works for RohTre's own channel (verified: https://developers.google.com/youtube/v3/docs/captions/download). Whether auto-generated captions can be downloaded is unverified; I will check in Phase 6.
- WhatsApp link format is `https://wa.me/<number without + or 0>?text=<encodeURIComponent(message)>`. Secondary sources only; the official help page did not load, so this is unverified until Phase 1.
- Cal.com Free covers 1 user; embeds on the free plan are not confirmed on the pricing page (unverified).

---

## 4. Questions (reply "defaults OK" or change any)

See the reply in the terminal. The same list:

1. **Founder.** Full name and the source of the About story? *Default:* "Rohan [surname]" placeholder, and About stays publish-blocked until you send the bio (a written note or a 10-minute voice-note transcript).
2. **Home services cards.** *Default:* Meta ads, Google Ads, D2C/e-commerce growth, social media, YouTube/video, websites, content, Shopify development, AI automation (9 cards).
3. **Sub-niches (R6).** *Default:* separate pages (fashion > clothing, shoes, jewellery each get their own page).
4. **URL pattern.** *Default:* Option B, `/lp/{service}-{niche}-brands-{country}`, for example `/lp/meta-ads-fashion-brands-usa`.
5. **Custom HTML (R26).** *Default:* editors get sanitized HTML (no scripts, iframes or event handlers); the developer gets trusted raw mode under CSP. Placement: a normal section plus 2 fixed slots ("after hero", "before form").
6. **Section variants (R27).** *Default:* testimonials grid | slider; results cards | split (image right); creatives grid | carousel; FAQ accordion only; everything else has 1 variant.
7. **AI creative copy (R30).** *Default:* AI may write headlines, subheads, pain-point wording, CTAs and process FAQ answers. It may never write numbers, client names, results, guarantees, timelines ("in 30 days"), awards or competitor comparisons; those come only from the facts store, or as [NEEDS DATA].
8. **Ad-mapping table (R5).** *Default:* yes.
9. **Booking tool.** *Default:* Cal.com embed, loaded only when "Book a Call" is clicked, showing the visitor's time zone. If the free plan does not allow embeds, use a link that opens Cal.com in a new tab.
10. **Lead alerts.** *Default:* email only (Resend) to addresses in settings. WhatsApp alerts are deferred: they need the WhatsApp Business Platform, approved templates and per-message fees.
11. **Currency (R7).** *Default:* money appears only in result metrics, in the currency the result was earned in (never converted), formatted for the page's country; India uses lakh/crore ("INR 24 L").
12. **Form fields (R10).** *Default:* as in R10. Ad-spend ranges are set per country in settings, for example India: under INR 50k / 50k-2 L / 2-10 L / 10 L+.
13. **Roles and 2FA.** *Default:* founder = owner, you = developer, team members = editors (added later). Authenticator-app 2FA is required for owner and developer, optional for editors.
14. **Design references.** *Default:* none beyond the rohtre-vault theme; I design the marketing layouts fresh and show screenshots at Phase 1.
15. **Default theme (R43).** *Default:* follow the visitor's system setting; the toggle is remembered per browser.
16. **Visibility and concept label (R42, R45).** *Default:* landing pages unlisted; home, blog, legal, About, Careers and Contact public; admin and previews private. AI bots are blocked from `/lp/` only (not the blog). Label text: "Concept work - not a client project".
17. **Docker (blocker).** Local Supabase needs Docker Desktop, which is not installed. *Default:* you install Docker Desktop (free for small businesses: unverified, I will check), and I test migrations locally. Alternative: a separate free Supabase project used only for testing, with your approval.

---

## 5. Inputs you must supply (checklist)

- [ ] Logo: SVG, light and dark versions, plus a square icon
- [ ] Confirm the palette: vault red/white/black (dark #0f0f0f / #f1f1f1 / #e50914, light #ffffff / #0f0f0f / #d4000f)
- [ ] Font: confirm Space Grotesk
- [ ] Phone number per country (IN, US, UK, AU, AE) and which have WhatsApp
- [ ] WhatsApp number(s)
- [ ] Emails: public contact address and lead-alert recipients
- [ ] Office address(es)
- [ ] Social links
- [ ] Founder full name, photo and bio source
- [ ] Badges: image, proof URL and last-verified date for each (Meta, Google, Shopify, government award, conversion stats)
- [ ] Case-study material: client name and permission to name them, logo, metrics with source screenshots, creatives
- [ ] Testimonials with name, role and permission
- [ ] Hero slides: 2 finished images, desktop and mobile crops, plus alt text
- [ ] Offer banners: one per landing page (desktop + mobile), starting with the 3 Phase 3 pages
- [ ] WordPress URL export (for redirects, Phase 7)
- [ ] `docs/design-guide.md` (before Phase 5)
- [ ] Privacy and terms: company legal name, registered address, grievance contact

## 6. Setup you must do yourself (all accounts owned by RohTre Media)

| Step | Env var names | Where they go |
|---|---|---|
| GitHub organisation + private repo | none | I will give push commands at the end of a phase |
| Supabase Pro project, region `ap-south-1` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser-safe), `SUPABASE_SECRET_KEY` (**server only**) | `.env.local` locally; Vercel env (Production + Preview) |
| Cloudinary account | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (**server only**) | same |
| Vercel Pro team, linked to the repo | `NEXT_PUBLIC_SITE_URL` | Vercel env |
| Resend account + verified sending domain | `RESEND_API_KEY` (server), `LEAD_ALERT_FROM` | same |
| Cloudflare Turnstile (spam protection, free; unverified) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (server) | same |
| Generated secret (I give the command) | `PREVIEW_TOKEN_SECRET` (server) | same |
| Cal.com account | none (URL saved in admin settings) | admin |
| Phase 5: Anthropic API | `ANTHROPIC_API_KEY` (server) | Vercel env |
| Phase 6: YouTube OAuth client | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` (server) | Vercel env |
| Phase 6: GTM, Meta | `NEXT_PUBLIC_GTM_ID`, `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` (server) | Vercel env |

Never paste any value into chat. Only names go in `.env.example`.

## 7. Proposed website.md skeleton

```
# RohTre Media website - project memory
(Read this first in every session. No secrets.)

## 1. Site map            (path, page kind, visibility, status)
## 2. Data model          (tables, key fields, relations, RLS per role)
## 3. Section library     (type | fields | variants | used on)
## 4. URLs and slugs      (pattern, generator rules, redirects-on-change)
## 5. Theme tokens        (token | dark | light | contrast result)
## 6. Visibility & bots   (modes; robots rules; AI block list; ad-bot allow list)
## 7. Decisions           (date | decision | reason)
## 8. Env var names       (name | server/browser | used by)
## 9. Phase checklist     (phase | status | date)
## 10. Open items         (item | owner | blocking?)
## 11. Next step
```
