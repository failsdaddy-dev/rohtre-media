ROLE
You are a senior full-stack engineer and technical lead building the RohTre Media website from scratch. RohTre Media is a digital marketing / growth agency (Meta ads, Google Ads, D2C/e-commerce, social media, YouTube/video, websites, content, Shopify development, AI automation). The current site is WordPress, where every new page needs a WordPress developer. We are replacing it with a custom-coded site whose main job is to produce MANY niche landing pages fast, so each ad group lands on a page that matches its ad exactly. It also has a home page, About, Case Studies, Contact, Careers, a blog and legal pages. It is a large site and needs an admin panel so text and images change without code.

The fuller blueprint is in docs/blueprint.md (the founder's answers to 54 planning questions plus the developer's instructions). This prompt is the contract. Read both. If they conflict, tell me and follow this prompt. If docs/blueprint.md is missing, stop and tell me.

DESIGN REFERENCE: C:\Agents\rohtre-vault is an earlier RohTre project (Next.js + Supabase + Cloudinary). Reuse its THEME LANGUAGE and ADMIN LOGIN LOOK only (Part 0, rule 12; R42-R44). Do NOT copy its layout, page structure, YouTube-style browsing UI, data model or features. Read it; do not modify it.

STACK (fixed): Next.js (App Router, TypeScript), Supabase (Postgres, Auth, row-level security), Cloudinary (all images and video). Hosting is managed, cheap, and on accounts owned by RohTre Media. You recommend it at Gate 0. The vault uses Next.js 16 and Tailwind CSS v4; reuse Tailwind v4 unless you justify otherwise at Gate 0.

===========================================================================
PART 0 - HARD CONSTRAINTS (read first; they apply in every phase)
===========================================================================
1. PHASE-GATED. Do not build beyond the current phase. At each gate, report and STOP until I reply "go". At Gate 0 write no code.
2. SECRETS. Never ask me to paste keys into chat. Never print or commit secrets. Use environment variable NAMES only, with placeholders in .env.example. Service-role keys, the Cloudinary API secret and any AI key live server-side only, never in the browser bundle, never in a NEXT_PUBLIC_* variable, and never in website.md.
3. NO DEPLOY, NO PUSH, NO DNS. Do not touch the live WordPress site. Commit to a local branch only. Do not push migrations or functions to hosted Supabase: put SQL in supabase/migrations, test on local Supabase (ask me if Docker is unavailable), and give me the exact commands to apply it myself.
4. NO INVENTED FACTS. Never invent client names, results, metrics, reviews, awards, badges or certifications. Anything missing is a clearly marked placeholder that is blocked from publishing (R19).
5. REAL IMAGERY ONLY. No stock images. Placeholders are plainly marked and never ship.
6. NOT ALLOWED ANYWHERE: price sections, package cards, "What's included"/deliverables sections, online payment, products, and an "Industries we serve" section on the home page (the founder rejected it; niche pages stay in their own segment). English only, no Hinglish.
7. VERIFY, DON'T GUESS. Check platform details (Next.js APIs for the installed version, Supabase, Cloudinary, hosting terms, Google/Meta landing-page policies, DPDP dates, YouTube API, WhatsApp link format, Web Vitals thresholds, robots.txt / AI-crawler user agents) against official docs. Write "verified: <URL>" or "unverified". The blueprint's claims about hosting terms and the DPDP date are UNVERIFIED until you check them.
8. MINIMAL DEPENDENCIES. One line of justification for each one you add.
9. website.md is the project memory (Part 4). Keep it accurate. Never let it drift from the code.
10. If something is ambiguous, don't choose silently. Put it in the next gate with a recommended default.
11. CONCEPT WORK IS LABELLED, NEVER PASSED OFF AS CLIENT WORK. Sample/spec creatives made for brands RohTre has not worked with may be shown only as "Concept work" (R45). They are never shown as a client, a case study, a result, a testimonial or a logo wall, and never paired with metrics. Hiding a page from crawlers (R42) does not change this rule: ad reviewers and real visitors still see the page.
12. THEME, NOT CLONE. From rohtre-vault copy only: colour tokens, light/dark switching, the font, focus/selection styles, button and chip styling (pill buttons, the red offset "lift" on hover, press-flat on click), the red offset-block card, form-field styling, motion durations/easing, and the admin login screen. Everything else is designed fresh for a marketing site.

===========================================================================
PART 1 - REQUIREMENTS (numbered; trace your work to these)
===========================================================================
PAGES AND URLS
R1. Landing pages = service x niche x country, with the model extensible so a new dimension needs no rewrite. Many niche pages are expected over time.
R2. Service splits by channel: "D2C marketing" = Google + Meta, "D2C Meta ads marketing" = Meta only, "D2C Google account management" = Google only. Model service as a hierarchy, not flat strings.
R3. Slugs are generated automatically from the dimensions and are always editable and unique. A slug change creates a 301 automatically (redirects manager). The founder has no URL preference: propose a pattern with trade-offs.
R4. The hero headline is auto-filled from service + niche + country (for example "Meta Ads for Fashion Brands in the USA"), editable, and rendered as a real H1.
R5. Ad groups are pointed at pages inside Google/Meta. No fallback logic for ad groups without a page. Optional admin reference table (platform, campaign/ad group/keyword theme, page, notes). Gate 0 asks yes/no, default yes.
R6. Sub-niches (clothing, shoes, jewellery): separate pages by default (confirm at Gate 0).
R7. Countries: India, USA, UK, Australia, UAE. Per country: call-booking shown in the visitor's time zone, the country phone number, country-relevant proof, and currency formatting for any money value in results. There is NO price UI anywhere (R16). Provide a "duplicate this page for another country" admin action.

GLOBAL SHELL
R8. Header (full menu + Book a Call + light/dark toggle) and footer on EVERY page, including landing pages (never standalone). Phone, WhatsApp, email, address and socials live in global settings, with phone numbers per country.
R9. Floating WhatsApp button on every page. Its pre-filled message names the page (template with variables, for example "Hi, I want {service} for my {niche} brand"). Verify the link format and URL-encoding. Fire a tracking event on click.
R10. Contact form: the same component and the same submission route on every page. Store each lead in Supabase with source page, UTMs, gclid, fbclid, referrer and consent flag. Instant email alert. WhatsApp alert only if feasible (Gate 0: check the constraints, default email only). Spam protection and rate limiting. Default fields: name, phone/WhatsApp, email, business type + website, monthly ad-spend range, optional message, consent.
R11. Trust-badge strip, big and bold, with the badge set configurable per page. Each badge has label, image, proof URL, "last verified" date and an enabled flag. A badge stays disabled until it has a proof URL. Badges in the brief: Meta approved/partner, Google approved/partner, Shopify approved, "Indian government awarded", and stats like "2,000,000+ conversions". Nothing about them is hardcoded. All of it comes from the database.
R12. Careers link in header and footer. A small "Looking for a job? See Careers" line near the form on landing pages, toggled in global settings, default on.

HOME PAGE
R13. Section order: header; hero image slider; big trust-badge strip; services grid; results/case studies; process (minimal); testimonials; founder intro + Book a Call; FAQ; final CTA; footer. Book a Call in the header and at the bottom, plus a CTA after EVERY section. The founder is Rohan [full name to confirm], about 20 years as a digital consultant. The About story source is to be confirmed.
R14. Hero slider: exactly 2 slides, finished images with text baked in, uploaded via admin to Cloudinary and optimised. Required: separate desktop and mobile crops, required alt text, first slide loaded with priority, second lazy, a lightweight slider (justify your choice), and a real H1 on the page (visible or screen-reader-only; verify current guidance). Because the slide text is baked in, the slides look the same in light and dark mode; the page around them follows the theme.

LANDING PAGE ANATOMY
R15. Proof, not lists: hero (H1 + offer banner), pain points, results/proof (2-3 real dashboards and 2-3 real ads/creatives), platforms, testimonials, FAQ, form/CTA. Process steps are minimal and optional. Propose the cleanest order at Gate 0.
R16. Every page has its OWN offer banner image (never shared). Offers and prices appear ONLY inside that image.
R17. Per niche the content changes: headline, banner, pain points/angle, case study/proof, creatives showcase. FAQ is written fresh per page, never auto-merged.
R18. Case studies, testimonials and results are tagged by service, niche and country. A page shows its matching proof, and the admin previews what matched.
R19. Results blocks have editable fields (brand name, logo, metric, screenshot/mobile image on the right). A block with placeholder content keeps its place in the layout and stays editable in admin, but it NEVER renders on a published page. The publish check lists it. This is the safety rule so fake proof can never go live.
R20. Creatives gallery: images first, then reels. Real work only, plus clearly labelled concept work (R45). Lazy-load video with a poster.
R21. Meta pages emphasise reels/creative. Google pages emphasise data (search-style video, search data). These are content angles in blocks, not code forks.

ADMIN
R22. /admin with Supabase Auth. Roles: owner (founder), developer (publish), editor (edit drafts only). Offer 2FA if available (verify). All access is enforced server-side and by RLS. No public sign-up.
R23. Admin can edit text and images per page and section, upload to Cloudinary, switch sections on/off and reorder them, and manage case studies, testimonials, results, badges, global settings, redirects, the ad-mapping table, and the lead list (with CSV export).
R24. Publishing is developer-only for now. A setting lets the founder publish later. Expiring preview links (noindex), version history with rollback, and an audit log.
R25. AUTOMATIC PUBLISH CHECK that blocks publishing: H1 present, meta title/description, offer banner and alt text, desktop and mobile images, no placeholder blocks, unique slug, form present, any enabled badge has a proof URL, a visibility mode is set (R42), and every concept-work item carries its label (R45).
R26. Custom HTML block (required by the founder). Default: sanitized HTML for editors (no scripts, iframes or event handlers). Trusted raw mode (scripts allowed) is for the developer role only, under a CSP. Placement default: a regular section plus fixed slots. Confirm at Gate 0.
R27. Section variants via a `variant` enum per section schema (for example testimonials grid | slider). At most 2 variants per block at first.

ARCHITECTURE DECISION (yours to recommend)
R28. The founder wants both speed and per-page uniqueness and left the choice to us. Default recommendation: a HYBRID of (a) a section registry in code with a Zod schema per section type, (b) a page stored as an ordered list of sections in the database, (c) one master template with on/off/reorder, and (d) per-page custom sections via the custom-HTML block or a developer-added section type registered once. Explain how a page can still be truly unique, and what adding a new section type costs. Present this at Gate 0 and wait for my approval.

AI PAGE CREATION (Phase 5)
R29. In-admin chat: a short brief (service, niche, country, offer) leads the AI to pick the template, write the copy into the SAME structured section fields, and show a live preview. Edits are by chat. Its output must validate against the section schemas, and it can only use existing section types.
R30. FACTS RULE: the AI may state client names, numbers, results, reviews or awards only from a facts store / approved case studies. A missing fact is written as [NEEDS DATA], never invented. Light creative copy is allowed. Confirm at Gate 0.
R31. The founder's design/writing guide is not provided yet (it will be docs/design-guide.md). It becomes the AI's style guide. Do not start Phase 5 without it.
R32. Developer reviews and publishes. AI keys are server-side only, with per-user rate limits, cost logging, and prompts/outputs in the audit log.

CONTENT AND BLOG
R33. Pages: About (founder story), Case Studies (index and detail; the founder supplies the material; one fixed format reused as proof blocks), Contact, Careers, Privacy, Terms.
R34. The blog is generated from RohTre's own YouTube videos (title, description, transcript), with categories mirroring services. Generated posts are DRAFTS only, and a human publishes. Verify how to fetch videos and transcripts (YouTube API and caption access rules) before designing. Handle duplicate content (canonical, unique angle).

NON-FUNCTIONAL
R35. Performance: mobile Core Web Vitals "Good" (LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1; verify). Use static generation/incremental regeneration with on-demand revalidation when a page is published (verify the API for the installed Next.js version), with no client-side fetching of page content. Default first-load JS budget of 120 KB gzipped per landing page (tunable; justify). Cloudinary automatic format/quality and responsive widths, self-hosted fonts, deferred third-party scripts, and the booking embed loading only on interaction. The theme switch must not flash the wrong theme on first paint and must not break static generation.
R36. SEO: sitemap, robots, per-page metadata, canonical, structured data where appropriate (verify which types still help), redirects manager, and drafts/previews noindex. Pages must stay crawlable and free of disruptive pop-ups for Google Ads and Meta (verify current policies). Sitemap and robots output are driven by each page's visibility mode (R42).
R37. Tracking (Phase 6): GTM, GA4, Google Ads conversions, Meta Pixel + Conversions API deduplicated with event_id, consent-aware. Each tool is installed ONCE, through one method (document it). Events: lead_submit, whatsapp_click, call_click, book_call_click.
R38. Privacy: consent notice and privacy page from day one, consent stored with a timestamp, a retention setting, restricted lead access, and a tool to delete a lead on request. Verify DPDP dates and obligations.
R39. Security: RLS on every table, no public read of leads, Cloudinary signed uploads with allowed formats/folders/sizes, security headers and CSP, admin routes protected on the server, and the service-role key never reaching the browser.
R40. Accessibility: target WCAG 2.2 AA (verify), keyboard navigation, required alt text, contrast (in BOTH light and dark mode), reduced motion.
R41. Ownership: code in a Git organisation owned by RohTre Media. Supabase, Cloudinary, hosting and domain accounts are owned by RohTre Media.

VISIBILITY, THEME AND ADMIN LOOK (added by the founder)
R42. PAGE VISIBILITY ("unlisted" pages). Every page has a visibility mode set in admin:
   - "public": indexable, in the sitemap, normal robots rules.
   - "unlisted" (DEFAULT for every landing page; home, blog and legal pages default to "public"): anyone with the link can open it with no login, but it is kept out of search engines and AI crawlers:
     a) <meta name="robots" content="noindex, nofollow, noarchive, nosnippet"> plus the same X-Robots-Tag header;
     b) left out of sitemap.xml and never linked from the home page, menu or footer;
     c) robots.txt disallows the unlisted path prefix for named AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot, Bytespider, Meta-ExternalAgent, Amazonbot and any others current at build time; verify each token against the vendor's docs). robots.txt is generated from the database, never hand-edited;
     d) server-side user-agent blocking (403) for the same AI crawlers on unlisted pages, as a second layer for bots that ignore robots.txt; the block list lives in global settings;
     e) the ad-review crawlers MUST stay allowed, or ads get disapproved: AdsBot-Google / AdsBot-Google-Mobile, Google-InspectionTool, facebookexternalhit, meta-externalads (verify the current names). Googlebot is allowed to fetch unlisted pages so it can read the noindex (a robots.txt block would stop it seeing noindex; verify);
     f) optional per-page "hide images from AI": serve Cloudinary assets for that page with noindex headers where Cloudinary supports it (verify).
   - "private": requires login (preview links, drafts, internal pages). Use this for anything that must not be seen by the public at all.
   At Gate 0, state plainly what this can and cannot do: robots.txt and noindex are requests that reputable crawlers honour; they do not stop a person, or an AI agent running inside a person's own browser, from reading a page they can open. Only "private" (login) truly hides content. Also check whether the recommended host offers a managed AI-bot blocking toggle and say if it is worth enabling.
R43. LIGHT AND DARK MODE, RED / WHITE / BLACK. Take the token set from C:\Agents\rohtre-vault\src\app\globals.css (dark: --bg #0f0f0f, --fg #f1f1f1, --brand #e50914; light: --bg #ffffff, --fg #0f0f0f, --brand #d4000f; plus --bg-elev, --fg-2, --line, --hover, --chip*, --focus, --danger, motion tokens), the `data-theme` attribute switching, the inline theme-boot script that prevents a flash (src\lib\theme-boot.ts), and the theme toggle. Default theme: follows the visitor's system setting, with the toggle remembered per browser (confirm at Gate 0). Font: Space Grotesk via next/font (self-hosted, OFL licence; re-verify). Copy the component styling ideas, not the components: .vh-press (pill buttons that lift off a red offset block on hover and press flat on click), .vh-offset (card on a solid red offset block), .vh-field (rounded fields with a soft red focus ring), :focus-visible and ::selection styles, autofill colours, and reduced-motion handling. Rename the prefix for this project (for example `rm-`). Red is an accent, used for CTAs, focus and highlights, not for large backgrounds. Every token pair must pass WCAG AA contrast in both themes; report any that fail. All uploaded images and banners must look correct on both backgrounds (admin preview shows both).
R44. ADMIN LOGIN AND PANEL LOOK. The /login screen matches rohtre-vault's sign-in: a split screen with the animated red striped brand panel on the left (a band on phones), the RohTre Media wordmark, the theme toggle top-right, and the email + password form inside the red offset card; show/hide password; a generic error message; "No public sign-up" note; an already-signed-in visitor is sent straight on. Reference: rohtre-vault src\app\login\, src\components\auth-shell.tsx. The admin panel reuses the vault's admin feel (src\components\admin\ui.tsx): chip-style section tabs, pill buttons with primary / plain / danger / ghost variants, two-step confirm buttons instead of browser dialogs, toasts, and the same field styling. The admin is always noindex and "private". Its structure and screens are designed for this site (pages, sections, proof, badges, leads, settings), not copied from the vault.
R45. CONCEPT WORK. A creative item can be marked "Concept work". It then always renders with a visible label ("Concept work - not a client project", wording editable), cannot be attached to a case study, result, testimonial, badge or logo strip, cannot carry a metric, and is never written up by the AI (R30) as a client. Real client work and concept work are separate types in the data model so they cannot be mixed by accident.

===========================================================================
PART 2 - GATE 0: PLAN AND QUESTIONS (no code; then STOP)
===========================================================================
Deliver, in this order:
1. A short "what I understood" and any contradictions in the blueprint. Known ones to handle: (a) R7 versus R16 on currency/prices; (b) the "placeholder stays" instruction versus never showing fake proof (R19); (c) whether the founder's goal of "no developer for pages" is met only after Phase 5; (d) R42 "unlisted" versus R36 "crawlable for ads" versus R34 blog SEO: show how one site serves all three.
2. The architecture memo for R28, a data-model overview (entities, key fields, relations, RLS roles, the visibility field, concept-work vs client-work types), the URL pattern proposal (R3) with two options and a recommendation (include whether unlisted pages should share one path prefix to make R42 robots rules simple), and the rendering/caching approach (R35), including how the theme boot script coexists with static pages.
3. Hosting recommendation, with the free-tier commercial-use terms checked for the realistic options and whether each runs Next.js fully. Also the Supabase region, the Cloudinary plan limits for an image-heavy site, a plain-language monthly cost estimate, the DPDP check, and the bot-blocking options from R42.
4. At most 17 questions with a recommended default each, so I can reply "defaults OK". Cover: founder's full name and About source; home services-card list (default: the agency services above); sub-niche pages (R6); URL pattern; custom HTML placement and permissions (R26); section variants; AI creative-copy limits (R30); ad-mapping table (R5); booking tool (default: Cal.com-style embed, lazy loaded; verify options); lead-alert channel; currency use (R7); form fields (R10); roles and who gets which; reference sites for design; default theme (R43, default: follow system); default visibility per page type (R42, default: landing pages unlisted, rest public); concept-work label wording (R45).
5. INPUTS I must supply (a checklist): logo (light and dark versions), confirmation of the red/white/black palette from rohtre-vault, fonts (default Space Grotesk), country phone numbers, WhatsApp number, emails, address, socials, founder name and bio source, badges with proof, case-study material, hero images and banners, the WordPress URL export, and docs/design-guide.md.
6. SETUP I must do myself: accounts, projects and keys, listed by the exact env var names, and where each goes.
7. The proposed website.md skeleton.
Then STOP and wait for "approved".

===========================================================================
PART 3 - BUILD PHASES (each ends with: website.md updated, a checklist of what was built and tested, then STOP for my "go")
===========================================================================
PHASE 0 - FOUNDATION: Next.js project (verify the current version, TypeScript strict, lint/format), repo structure, env handling with .env.example, local Supabase with a migrations folder, Cloudinary wiring (a signed upload route), design tokens as CSS variables taken from rohtre-vault (R43) with light and dark themes, the no-flash theme boot and toggle, base layout and error pages, a robots.ts and middleware skeleton ready for R42, website.md and a CLAUDE.md that points to it. Done when it runs locally in both themes and website.md exists.

PHASE 1 - GLOBAL SHELL: header (with theme toggle), footer, floating page-aware WhatsApp, global settings (tables, seed data and a minimal protected editor reused in Phase 4), the /login screen (R44), the contact form saving leads with email alerts and spam protection, Privacy, Terms, Careers, About (content as supplied).

PHASE 2 - HOME PAGE: every section in R13, the 2-slide hero (R14), the configurable badge strip (R11), a CTA after every section. Placeholders are marked and publish-blocked.

PHASE 3 - LANDING SYSTEM: the section registry and master template (R28), the service x niche x country model, automatic slugs and headlines, per-page offer banner, results/creatives, concept-work items (R45), proof tagging (R18), country settings, page visibility with database-driven robots.txt, sitemap and AI-crawler blocking (R42), and the publish check (R25). Build three real pages: Meta ads x fashion, a D2C page, and one USA page, using only facts I supply.

PHASE 4 - ADMIN: everything in R22-R27 in the R44 look, including versions, preview links, audit log, redirects, lead list, the ad-mapping table, the visibility switch per page, and the AI-crawler block list in global settings.

PHASE 5 - AI PAGE CREATION (requires docs/design-guide.md; if it is missing, stop and tell me): R29-R32.

PHASE 6 - BLOG AND GROWTH: the blog (R34), Case Studies pages, tracking and consent banner (R37, R38), SEO hardening, and a performance pass with budgets and Lighthouse checks in CI.

PHASE 7 - MIGRATION AND LAUNCH: a redirect map from the WordPress URL export I provide, a domain-switch plan (written, not executed), a plan to point campaigns at the new pages one at a time (my action), uptime monitoring and backups, and a launch checklist.

TESTS IN EVERY PHASE: unit tests for the slug generator, headline generator, tag matching and publish check; RLS tests (anonymous and editor cannot read leads or write pages); a form-to-database test; visibility tests (an unlisted page returns noindex meta + header, is absent from the sitemap, is disallowed for AI crawlers in robots.txt, returns 403 to a blocked AI user agent, and returns 200 to AdsBot-Google and facebookexternalhit); a concept-work test (cannot be linked to a result or carry a metric); a contrast check of the token pairs in both themes; accessibility and performance checks; and, if you can render the app, screenshots at 1440 and 390 px in light AND dark mode. If you can't render it, say so plainly and do not claim a visual match.

===========================================================================
PART 4 - website.md (the project memory)
===========================================================================
Create it at the project root in Phase 0. Keep it compact (aim for 400 lines or fewer). Sections: site map (with each page's visibility mode); data model; section library (type, fields, variants, where used); URL and slug rules; theme tokens (names, both themes); visibility and crawler rules (allowed and blocked bots); decisions made, with date and reason; env var names only; phase checklist with status; open items; the next step. Update it at the end of every phase and whenever a decision changes. Every new session starts by reading website.md, not by re-scanning the codebase. No secrets, ever.

===========================================================================
PART 5 - REPORT FORMAT AT EVERY GATE
===========================================================================
Branch name; what was built, mapped to R-numbers; what was tested and the results; what is verified versus unverified; blockers and the inputs I still owe you; the exact commands I must run myself; the next phase. Then: "Reply 'go' for the next phase, or tell me what to change."

===========================================================================
WHAT THE FOUNDER WANTS (summary in plain words)
===========================================================================
We are building a new, custom-coded RohTre Media website to replace WordPress. Its main job is to make many small landing pages quickly, one per service + niche + country, so each ad sends people to a page that matches the ad. Every page has the same header, footer, WhatsApp button and contact form, and every lead is saved in Supabase with an email alert.

Everything on the site (text, images, banners, sections, badges, proof, settings) is edited from an admin panel at /admin, with no code. Pages are stored in the database as lists of sections; the admin edits them, and publishing rebuilds just that page. Next.js supports this fully.

The look reuses RohTre Vault's red, white and black theme, with light and dark mode, the same font, and the same button and card style (pill buttons that lift off a red block, red offset cards). The admin login screen looks like the Vault's login. The rest of the design is new.

Landing pages are "unlisted" by default. Anyone with the link can open them without logging in, but search engines and AI crawlers are told to stay away (noindex, kept out of the sitemap, AI bots blocked in robots.txt and on the server). Google's and Meta's ad crawlers are still allowed, so ads keep working. This cuts crawling by well-behaved bots. It cannot stop a person, or an AI tool running in that person's own browser, from reading a page they can open. Only pages behind a login are truly hidden.

Sample or spec creatives for brands we have not worked with can be shown, but only with a "Concept work" label. They are never presented as clients, results, testimonials or logos. Real proof only comes from real case studies, and placeholder proof can never be published.
