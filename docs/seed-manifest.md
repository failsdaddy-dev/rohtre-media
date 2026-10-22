# Seed manifest

Where every seeded file and value came from. Everything below was downloaded once into the repo and is uploaded to our own Cloudinary or served from `public/`. The site never links to rohtremedia.com or any WordPress host.

Live page: https://rohtremedia.com/e-commerce-marketing/ (read 2026-10-22).

## Product mockups (`npm run seed:home`)

These are the live page's product carousel (Elementor loop carousel). Each image is a `background-image` in that carousel's CSS. There are 5 slides, and all 5 were taken. Files are unmodified: 941×1672 PNG (9:16).

| Repo file | Cloudinary id | Card | Source URL |
|---|---|---|---|
| `scripts/seed-assets/products/grow.png` | `rohtre-media/images/products/grow` | Grow This Product | https://rohtremedia.com/wp-content/uploads/2026/08/ChatGPT-Image-Aug-1-2026-02_58_26-PM.png |
| `scripts/seed-assets/products/boost.png` | `rohtre-media/images/products/boost` | Boost This Product | https://rohtremedia.com/wp-content/uploads/2026/08/ChatGPT-Image-Aug-1-2026-02_55_11-PM.png |
| `scripts/seed-assets/products/launch.png` | `rohtre-media/images/products/launch` | Launch This Product | https://rohtremedia.com/wp-content/uploads/2026/08/ChatGPT-Image-Aug-1-2026-02_51_31-PM.png |
| `scripts/seed-assets/products/scale.png` | `rohtre-media/images/products/scale` | Scale This Product | https://rohtremedia.com/wp-content/uploads/2026/08/ChatGPT-Image-Aug-1-2026-02_45_04-PM.png |
| `scripts/seed-assets/products/market.png` | `rohtre-media/images/products/market` | Market This Product | https://rohtremedia.com/wp-content/uploads/2026/08/ChatGPT-Image-Aug-1-2026-02_41_25-PM.png |

Every card uses the alt text "Product placeholder image". The live star ratings were not copied.

## Client showcase ("We build growth that shows")

These values come from the live page's Elementor counters: `data-to-value`, the prefix and suffix spans, and the title. They are stored as the code defaults in `src/content/home-schema.ts`. `npm run seed:home` writes them into a saved home page that doesn't have them yet.

| Slide | ROAS | Sales | Orders | Impressions | Lower CPA | Conversion rate |
|---|---|---|---|---|---|---|
| Rama Chikan | 1.5X | 28X | 12X | 49M+ | 17% | 20% |
| Harmiche (the live heading reads "HARMICHE") | 2.6X | 3.2X | 2.8X | 5.4M+ | 3.1% | 1.7% |

- None of the counters has a prefix. The live counter titles misspell "IMPRESSSIONS"; we spell it "Impressions".
- Rama Chikan matches the founder's screenshot exactly.
- The live poster images were not copied, so the posters ship empty.
- Period and source are not on the live page. They are owed by the founder and listed as launch blockers.

## Platform logos (`public/brand/platforms/`, served as-is, unmodified)

| File | Source |
|---|---|
| `shopify-bag.svg` | Shopify brand assets: https://www.shopify.com/brand-assets → `shopify-shopping-bag.zip` (https://cdn.shopify.com/static/brand-assets/shopify-shopping-bag.zip) → `02 - Glyph/svg/shopify_glyph.svg` |
| `meta-lockup-white.svg` | Meta brand resources: https://about.meta.com/brand/resources/meta/company-brand/ → `Meta_Company-Lockup.zip` → `4 Mono White/RGB/Meta_lockup_mono_white_RGB.svg` |

These logos mean "platforms we work with". They appear only in the Who We Serve icon and in the hero illustration, never as a partner or certification badge.

## Client logos (`npm run seed:logos`, previous round)

These 17 files come from the same live page's "Brands we've worked with" row. They live in `scripts/seed-assets/brands/` and upload to `rohtre-media/images/brands/{name}`. See `website.md`, decisions of 2026-10-22.
