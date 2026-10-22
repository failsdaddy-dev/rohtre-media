import { z } from "zod";
import { emptySlot, mediaSlotSchema } from "./media-slot";

// Home page content (R13, R14). Stored as JSON in public.page_content
// (key "home"), checked here. Any section that is missing or invalid falls
// back to its default on its own, so the page always renders. The admin
// edits exactly these fields (its forms are generated from this schema).
// Every image/video slot is a media slot (./media-slot.ts). Headings are two-tone: `title` plus an
// optional `accent` line shown in the red gradient.

export const mediaSchema = z.object({
  publicId: z.string().regex(/^rohtre-media\/[A-Za-z0-9_./-]+$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type Media = z.infer<typeof mediaSchema>;

/** The call to action at the end of a section (R13: one after every section). */
const cta = z.object({ text: z.string().max(140), label: z.string().min(1).max(40) });

const slide = z.object({
  /** Image (text baked in) or video. Desktop 12:5 (about 1920×800), mobile 4:5 (about 1080×1350). */
  desktop: mediaSlotSchema,
  mobile: mediaSlotSchema,
  /** Optional link when the slide is clicked. */
  href: z.string().startsWith("/").nullable(),
});
const emptySlide = () => ({ desktop: emptySlot("12:5"), mobile: emptySlot("4:5"), href: null });

/** Optional brand logo (Cloudinary id) with its alt text. */
const pid = z.string().regex(/^rohtre-media\/[A-Za-z0-9_./-]+$/);
const logo = z.object({ logo_public_id: pid.nullable(), alt: z.string().max(120) });
/** A client-showcase number; empty = not shown. */
const metric = z.number().nonnegative().max(1_000_000).nullable();

/**
 * Logos from the "Brands we've worked with" row of the live site, uploaded by
 * `npm run seed:logos` to rohtre-media/images/brands/{slug}. An unidentified
 * file is stored switched off until someone names it.
 */
export const BRAND_LOGOS = [
  ["pedtalks-sports", "PedTalks Sports"],
  ["nealguides", "NealGuides"],
  ["ea", "EA"],
  ["433", "433"],
  ["oh-my-goal", "Oh My Goal"],
  ["sportbible", "SPORTbible"],
  ["ak-interactive", "AK Interactive"],
  ["dayz", "DayZ"],
  ["italki", "italki"],
  ["teddy-blake", "Teddy Blake New York"],
  ["sidemen", "Sidemen"],
  ["betterhelp", "BetterHelp"],
  ["ricekraft", "RiceKraft"],
  ["law-care-legal", "Law Care Legal"],
  ["tfv-gaming", "TFV Gaming"],
  ["bubbles-in-korea", "Bubbles in Korea"],
  ["unidentified-1", "Unidentified logo 1"],
] as const;

export const SERVICE_ICONS = [
  "megaphone",
  "search",
  "bag",
  "users",
  "play",
  "monitor",
  "pen",
  "cart",
  "sparkles",
] as const;

export const homeSchema = z.object({
  hero: z
    .object({
      eyebrow: z.string().max(60),
      h1: z.string().min(1).max(120),
      h1Accent: z.string().max(60),
      subline: z.string().max(240),
      ctaLabel: z.string().min(1).max(40),
      slides: z.array(slide).length(2), // R14: exactly two
    })
    .default({
      eyebrow: "Digital marketing & growth agency",
      h1: "We make brands",
      h1Accent: "unstoppable.",
      subline: "Meta ads, Google Ads, scroll-stopping creatives and websites for brands that want to grow.",
      ctaLabel: "Book a Call",
      slides: [emptySlide(), emptySlide()],
    }),

  badges: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Partners & recognition",
      title: "Partners in",
      accent: "your growth.",
      cta: { text: "Want this team on your brand?", label: "Book a Call" },
    }),

  whoWeServe: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      intro: z.string().max(300),
      items: z
        .array(
          z.object({
            title: z.string().min(1).max(60),
            text: z.string().max(240),
            /** Shown when no platform logo is set. */
            icon: z.enum(SERVICE_ICONS),
            /** Optional official platform logos (e.g. Shopify; Meta + Google), unmodified files only. */
            logos: z.array(logo).max(3),
          }),
        )
        .min(1)
        .max(8),
      values: z.array(z.string().min(1).max(40)).max(6),
      cta,
    })
    .default({
      enabled: true,
      // Wording from the live e-commerce page (rohtremedia.com/e-commerce-marketing), typos fixed.
      eyebrow: "Who We Serve",
      title: "Everything Your",
      accent: "Ecommerce Brand Needs.",
      intro: "One Partner, Every Stage of Growth.",
      items: [
        {
          title: "Shopify Development",
          text: "Custom stores built for speed, UX and scale.",
          icon: "cart",
          logos: [],
        },
        {
          title: "Ecommerce Strategy",
          text: "Winning products, positioning and store strategy that convert.",
          icon: "bag",
          logos: [],
        },
        {
          title: "Performance Marketing",
          text: "Data-driven ads that drive traffic, sales and profitable growth.",
          icon: "megaphone",
          logos: [],
        },
        {
          title: "Creative Production",
          text: "Scroll-stopping creatives and videos that turn attention into sales.",
          icon: "play",
          logos: [],
        },
        {
          title: "Automation & Retention",
          text: "Email, SMS and automation systems that maximise LTV and repeat sales.",
          icon: "sparkles",
          logos: [],
        },
      ],
      values: ["One Team", "End-to-End Solutions", "Proven Process", "Real Growth"],
      cta: { text: "Book a free strategic call and let’s grow your brand.", label: "Book a Call" },
    }),

  products: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      intro: z.string().max(400),
      items: z
        .array(
          z.object({
            label: z.string().max(40),
            action: z.string().min(1).max(40),
            media: mediaSlotSchema,
          }),
        )
        .min(1)
        .max(8),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Product Showcase",
      title: "Have an Ecommerce Product?",
      accent: "Let’s Scale It.",
      intro:
        "From first launch to seven-figure scale, we help ecommerce brands turn products into profitable growth through Shopify, creative and performance marketing.",
      items: ["Grow", "Boost", "Launch", "Scale", "Market"].map((verb) => ({
        label: "Your Product",
        action: `${verb} This Product`,
        media: emptySlot("4:5"),
      })),
      cta: { text: "Have a product to grow? Let’s talk about it.", label: "Book a Call" },
    }),

  engage: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      subline: z.string().max(80),
      body: z.string().max(400),
      points: z.array(z.string().min(1).max(60)).max(6),
      /** Shown inside phone frames (always 9:16). */
      phones: z.array(mediaSlotSchema).min(1).max(4),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Scroll. Engage. Convert",
      title: "Your Product. Our Creative.",
      accent: "More Customers.",
      subline: "More Scrolls. More Sales.",
      body: "We combine high-converting product selections with scroll-stopping creatives to drive clicks, add-to-cart moments, and real revenue.",
      points: ["Curated Winning Products", "Scroll-Stopping Video Ads", "High ROAS Campaigns", "More Sales Every Day"],
      // The live section shows two phone videos.
      phones: [emptySlot("9:16", "video"), emptySlot("9:16", "video")],
      cta: {
        text: "Ready to grow your product? Let’s make it your next success story.",
        label: "Book a Call",
      },
    }),

  videoAds: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      intro: z.string().max(300),
      strapline: z.string().max(80),
      body: z.string().max(300),
      items: z
        .array(z.object({ title: z.string().min(1).max(60), media: mediaSlotSchema }))
        .min(1)
        .max(8),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Video Ads & Reels",
      title: "Video Ads People Watch.",
      accent: "Brands People Remember.",
      intro: "High-performing video content that stops the scroll, builds trust, and drives real D2C growth.",
      strapline: "Creative that scrolls. Ads that sell.",
      body: "From thumb-stopping reels to cinematic product films, we craft video content that engages, converts, and builds brands.",
      items: ["Reels & UGC Ads", "Product Films", "Paid Social Creatives", "Performance Storytelling"].map((title) => ({
        title,
        media: emptySlot("9:16", "video"),
      })),
      cta: {
        text: "Ready to create ads that drive growth? Let’s make your next campaign your best one yet.",
        label: "Book a Call",
      },
    }),

  results: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      intro: z.string().max(400),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Results",
      title: "Ads that",
      accent: "build brands.",
      intro: "Real numbers from real campaigns, with the dashboards to prove them.",
      cta: { text: "Let’s plan your numbers.", label: "Book a Call" },
    }),

  showcase: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      intro: z.string().max(300),
      items: z
        .array(
          z.object({
            client: z.string().max(80),
            logo_public_id: pid.nullable(),
            media: mediaSlotSchema,
            /** Each metric shows only when it has a value. */
            metrics: z.object({
              roas: metric,
              sales: metric,
              orders: metric,
              impressions: metric,
              lowerCpa: metric,
              conversionRate: metric,
            }),
          }),
        )
        .max(6),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "RohTre Media",
      title: "We build growth",
      accent: "that shows.",
      intro: "Strategy. Creative. Technology. All working together for real results.",
      // Two empty cards: no client names or numbers until real, approved ones exist.
      items: [0, 1].map(() => ({
        client: "",
        logo_public_id: null,
        media: emptySlot("4:5"),
        metrics: { roas: null, sales: null, orders: null, impressions: null, lowerCpa: null, conversionRate: null },
      })),
      cta: { text: "Want results like this for your brand? Let’s make it happen.", label: "Book a Call" },
    }),

  brands: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      /** In display order; switched-off logos are kept but not shown. */
      items: z
        .array(
          z.object({
            name: z.string().min(1).max(80),
            logo_public_id: pid.nullable(),
            alt: z.string().max(120),
            enabled: z.boolean(),
          }),
        )
        .max(60),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Clients",
      title: "Brands We’ve",
      accent: "Worked With.",
      items: BRAND_LOGOS.map(([slug, name]) => ({
        name,
        logo_public_id: `rohtre-media/images/brands/${slug}`,
        alt: name,
        enabled: !slug.startsWith("unidentified"),
      })),
      cta: { text: "Want your brand on this list?", label: "Book a Call" },
    }),

  process: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      intro: z.string().max(300),
      steps: z
        .array(z.object({ title: z.string().min(1).max(60), text: z.string().max(200) }))
        .min(1)
        .max(5),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "How we work",
      title: "From first call",
      accent: "to growing sales.",
      intro: "A simple path from a 15-minute call to campaigns that keep improving.",
      steps: [
        { title: "Discovery call", text: "A 15-minute call to understand your brand, goals and budget." },
        { title: "Strategy & creatives", text: "We plan the channels and make the first ads and creatives." },
        { title: "Launch", text: "Campaigns go live with tracking set up from day one." },
        { title: "Optimise & report", text: "We test, improve and report on what’s working." },
      ],
      cta: { text: "Step one takes 15 minutes.", label: "Book your call" },
    }),

  testimonials: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      variant: z.enum(["grid", "slider"]), // R27: slider = gently scrolling rows
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Testimonials",
      title: "Hear what clients",
      accent: "say about us.",
      variant: "slider",
      cta: { text: "Want to be our next success story?", label: "Book a Call" },
    }),

  founder: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      /** Shown large; each line fills with white as it scrolls into view. */
      quote: z.string().max(300),
      name: z.string().min(1).max(80),
      role: z.string().max(80),
      bio: z.string().max(800),
      /** About 20 per the brief; null until the founder confirms. */
      yearsExperience: z.number().int().min(1).max(60).nullable(),
      photo: mediaSchema.nullable(),
      ctaLabel: z.string().min(1).max(40),
    })
    .default({
      enabled: true,
      eyebrow: "Meet the founder",
      // Headline and quote from the live About and home pages.
      title: "Built on creative vision",
      accent: "and digital mastery.",
      quote:
        "We build brands with precision: knowing where to focus, how much to invest, and how to turn attention into sales.",
      name: "Rohan Trehan",
      role: "CEO & Consultant",
      bio: "Rohan is the founder and CEO of RohTre Media and a digital growth consultant. He leads the team’s strategy and creative direction.",
      yearsExperience: null,
      photo: { publicId: "rohtre-media/images/team/rohan-trehan", width: 400, height: 400 },
      ctaLabel: "Book a call with Rohan’s team",
    }),

  faq: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(100),
      accent: z.string().max(60),
      items: z
        .array(
          z.object({
            q: z.string().min(1).max(200),
            a: z.string().min(1).max(1200),
            /** Drafts show while building but never on the live site until approved. */
            status: z.enum(["draft", "ready"]),
          }),
        )
        .max(16),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "FAQ",
      title: "Questions brands",
      accent: "ask us.",
      items: [
        {
          q: "What does RohTre Media do?",
          a: "We’re a digital marketing and growth agency. We plan and run Meta and Google ad campaigns, make the creatives and videos for them, and build the websites and landing pages they send people to.",
          status: "draft",
        },
        {
          q: "Which countries do you work with?",
          a: "We work with brands in India, the USA, the UK, Australia and the UAE.",
          status: "draft",
        },
        {
          q: "How much does it cost?",
          a: "It depends on your goals, the channels and your ad budget. After a short discovery call, we send you a proposal.",
          status: "draft",
        },
        {
          q: "Do you make the ads and creatives too?",
          a: "Yes. Our team writes the copy and designs the images, videos and reels for your campaigns.",
          status: "draft",
        },
        {
          q: "How do we get started?",
          a: "Book a call or send the enquiry form. We’ll talk about your brand and goals, then suggest a plan.",
          status: "draft",
        },
        {
          q: "Will I know what my budget is doing?",
          a: "Yes. We report regularly on what your budget is doing and what we’re changing next.",
          status: "draft",
        },
      ],
      cta: { text: "Still have a question?", label: "Ask us directly" },
    }),

  finalCta: z
    .object({
      eyebrow: z.string().max(60),
      title: z.string().min(1).max(80),
      accent: z.string().max(40),
      text: z.string().max(240),
      label: z.string().min(1).max(40),
    })
    .default({
      eyebrow: "Ready to unlock growth?",
      title: "Let’s talk",
      accent: "about your brand.",
      text: "Tell us about your brand and goals. We’ll get back to you with a plan.",
      label: "Book a Call",
    }),
});

export type HomeContent = z.infer<typeof homeSchema>;
export const DEFAULT_HOME: HomeContent = homeSchema.parse({});

/** Parse stored JSON section by section, so one bad section never wipes the others. */
export function parseHome(raw: unknown): HomeContent {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(homeSchema.shape) as (keyof HomeContent)[]) {
    const parsed = homeSchema.shape[key].safeParse(input[key]);
    out[key] = parsed.success ? parsed.data : DEFAULT_HOME[key];
  }
  return out as HomeContent;
}
