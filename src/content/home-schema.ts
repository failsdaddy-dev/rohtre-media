import { z } from "zod";
import { FRAME_SIZES } from "./layout-presets";
import {
  emptyLandscape,
  emptyPhone,
  emptySlot,
  isLandscapeAspect,
  isPhoneAspect,
  landscapeSlotSchema,
  mediaSlotSchema,
  phoneSlotSchema,
  slotSchema,
} from "./media-slot";

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
  "network",
  /** The official Shopify bag (public/brand/platforms/shopify-bag.svg), unmodified. */
  "shopify",
] as const;

/**
 * The six "Who We Serve" cards (the 6th card and all tags added 2026-10-22
 * at the founder's request). Also used to bring older saved copies up to
 * date (see upgrade()).
 */
const SERVICE_CARDS = [
  {
    title: "Shopify Development",
    text: "Custom stores built for speed, UX and scale.",
    icon: "shopify",
    tint: "green",
    tags: ["Shopify", "CRO", "Store design"],
  },
  {
    title: "Ecommerce Strategy",
    text: "Winning products, positioning and store strategy that convert.",
    icon: "cart",
    tint: "coral",
    tags: ["Positioning", "Product research", "Pricing"],
  },
  {
    title: "Performance Marketing",
    text: "Data-driven ads that drive traffic, sales and profitable growth.",
    icon: "megaphone",
    tint: "purple",
    tags: ["Meta ads", "Google ads", "Retargeting"],
  },
  {
    title: "Creative Production",
    text: "Scroll-stopping creatives and videos that turn attention into sales.",
    icon: "play",
    tint: "orange",
    tags: ["UGC", "Video ads", "Static ads"],
  },
  {
    title: "Automation & Retention",
    text: "Email, SMS and automation systems that maximise LTV and repeat sales.",
    icon: "network",
    tint: "blue",
    tags: ["Email", "SMS", "WhatsApp"],
  },
  {
    title: "Social Media & Influencers",
    text: "Content, creators and community that build trust and reach.",
    icon: "users",
    tint: "coral",
    tags: ["Content", "Influencers", "Community"],
  },
] as const;

/** Icon tints: the --tint-* tokens in src/app/globals.css. */
export const TINTS = ["green", "coral", "purple", "orange", "blue"] as const;
export type Tint = (typeof TINTS)[number];

/**
 * Video Ads icon row icons (ServiceIcon names). The first four are the
 * live page's meanings: reel (Reels & UGC), clapperboard (Product Films),
 * target (Paid Social), rising bars (Performance Storytelling).
 */
export const AD_ICONS = [
  "reel",
  "clapper",
  "target",
  "growth",
  "play",
  "megaphone",
  "sparkles",
  "eye",
  "cart",
  "users",
] as const;
export type AdIcon = (typeof AD_ICONS)[number];
const AD_ROW = [
  ["Reels & UGC Ads", "reel"],
  ["Product Films", "clapper"],
  ["Paid Social Creatives", "target"],
  ["Performance Storytelling", "growth"],
] as const;
const adIconFor = (title: string, i: number): AdIcon =>
  AD_ROW.find(([t]) => t.toLowerCase() === title.trim().toLowerCase())?.[1] ?? AD_ROW[i % AD_ROW.length][1];

/** The Video Ads stage, empty: two modern phones and a 16:9 monitor. */
function emptyStage() {
  return { left: emptyPhone(), centre: emptyLandscape(), right: emptyPhone() };
}
function defaultAdIcons(): { title: string; icon: AdIcon }[] {
  return AD_ROW.map(([title, icon]) => ({ title, icon }));
}

/** Client-showcase metric icons; each has its own tint (the live page's colours). */
export const METRIC_ICONS = ["trend", "cart", "box", "eye", "currency", "cursor"] as const;
export type MetricIcon = (typeof METRIC_ICONS)[number];
export const METRIC_TINT: Record<MetricIcon, Tint> = {
  trend: "coral",
  cart: "coral",
  box: "coral",
  eye: "purple",
  currency: "orange",
  cursor: "blue",
};

/**
 * One client-showcase number. The text shown is prefix + value (with
 * `decimals` places) + suffix, e.g. 1.5 + "X" = "1.5X"; it counts up from 0.
 * Hidden when switched off or empty.
 */
const showcaseMetric = z.object({
  label: z.string().min(1).max(30),
  value: z.number().nonnegative().max(1_000_000_000).nullable(),
  decimals: z.number().int().min(0).max(3),
  prefix: z.string().max(4),
  suffix: z.string().max(6),
  icon: z.enum(METRIC_ICONS),
  enabled: z.boolean(),
});
const METRIC_DEFAULTS = [
  ["ROAS", "X", "trend"],
  ["Sales", "X", "cart"],
  ["Orders", "X", "box"],
  ["Impressions", "M+", "eye"],
  ["Lower CPA", "%", "currency"],
  ["Conversion rate", "%", "cursor"],
] as const;
const showcaseMetrics = (values: (number | null)[]) =>
  METRIC_DEFAULTS.map(([label, suffix, icon], i) => ({
    label,
    value: values[i] ?? null,
    decimals: String(values[i] ?? "").split(".")[1]?.length ?? 0,
    prefix: "",
    suffix,
    icon,
    enabled: true,
  }));
const showcaseSlide = (brand: string, values: (number | null)[]) => ({
  brand,
  poster: emptySlot("1:1"),
  period: "",
  source: "",
  currency: "₹",
  metrics: showcaseMetrics(values),
});

// From the live e-commerce page's hero.
const HERO_TAGLINE = ["Shopify Development", "Performance Marketing", "Automation"];

/** Product mockups from the live page's product carousel, uploaded by `npm run seed:home`. */
export const PRODUCT_IMAGES = ["grow", "boost", "launch", "scale", "market"] as const;

export const homeSchema = z.object({
  hero: z
    .object({
      /** composition = headline + video on the left, visual on the right; slider = the two baked-text slides. */
      mode: z.enum(["composition", "slider"]).default("composition"),
      eyebrow: z.string().max(60),
      h1: z.string().min(1).max(120),
      h1Accent: z.string().max(60),
      subline: z.string().max(240),
      ctaLabel: z.string().min(1).max(40),
      /** Composition: the line under the headline, shown dot-separated. */
      tagline: z.array(z.string().min(1).max(40)).max(5).default(HERO_TAGLINE),
      /** Composition: a landscape video (a muted loop clip, or a player with sound); 16:9 by default, Fill or Fit. */
      video: landscapeSlotSchema().default(emptyLandscape()),
      videoCaption: z.string().max(80).default("Watch how we help brands grow"),
      ctaNote: z.string().max(120).default("Book a free strategic call with our experts"),
      /** Composition: the coded magnet illustration, or your own transparent image/video. */
      visual: z.enum(["illustration", "media"]).default("illustration"),
      visualMedia: slotSchema(["1:1", "4:5", "16:10", "16:9"]).default(emptySlot("1:1")),
      slides: z.array(slide).length(2), // R14: exactly two (slider mode)
    })
    .default({
      mode: "composition",
      tagline: HERO_TAGLINE,
      video: emptyLandscape(),
      videoCaption: "Watch how we help brands grow",
      ctaNote: "Book a free strategic call with our experts",
      visual: "illustration",
      visualMedia: emptySlot("1:1"),
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
            /** Shown when no platform logo is set ("shopify" = the official Shopify bag). */
            icon: z.enum(SERVICE_ICONS),
            /** Icon colour, on a translucent disc of the same colour. */
            tint: z.enum(TINTS).default("coral"),
            /** Optional official platform logos (e.g. Shopify; Meta + Google), unmodified files only. */
            logos: z.array(logo).max(3),
            /** Up to 3 short tags shown as square chips at the bottom of the card (e.g. META ADS). */
            tags: z.array(z.string().min(1).max(24)).max(3).default([]),
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
      items: SERVICE_CARDS.map((c) => ({ ...c, tags: [...c.tags], logos: [] })),
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
            media: slotSchema(["9:16", "3:4", "4:5"]),
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
      // The live page's mockups (9:16, so nothing is cropped); replace them in the admin.
      items: PRODUCT_IMAGES.map((slug) => ({
        label: "Your Product",
        action: `${slug.charAt(0).toUpperCase()}${slug.slice(1)} This Product`,
        media: {
          ...emptySlot("9:16"),
          publicId: `rohtre-media/images/products/${slug}`,
          format: "png",
          alt: "Product placeholder image",
        },
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
      /** Shown inside phone frames (phone shapes only, Fill or Fit). 4 or more become a sideways row. */
      phones: z.array(phoneSlotSchema()).min(1).max(6),
      /** Phone size on the site (scale in layout-presets.ts), always capped by the screen height. */
      size: z.enum(FRAME_SIZES).default("medium"),
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
      phones: [emptyPhone(), emptyPhone()],
      size: "medium",
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
      /** Shown centred under the monitor, with a short red rule. */
      strapline: z.string().max(80),
      body: z.string().max(300),
      /**
       * DEPRECATED (2026-10-22): the old four phone cards. Kept in the saved
       * row untouched, no longer shown or edited; the stage and the icon row
       * replaced them (filled media were copied into the stage on read).
       */
      items: z
        .array(z.object({ title: z.string().min(1).max(60), media: phoneSlotSchema() }))
        .min(1)
        .max(8),
      /** Left phone, centre monitor, right phone (the phones overlap the monitor's edges). */
      stage: z
        .object({ left: phoneSlotSchema(), centre: landscapeSlotSchema(), right: phoneSlotSchema() })
        .default(emptyStage()),
      /** The row of icons and titles under the stage (2 to 6). */
      icons: z
        .array(z.object({ title: z.string().min(1).max(60), icon: z.enum(AD_ICONS) }))
        .min(2)
        .max(6)
        .default(defaultAdIcons()),
      /** Stage size on the site (scale in layout-presets.ts), always capped by the screen height. */
      size: z.enum(FRAME_SIZES).default("medium"),
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
      items: AD_ROW.map(([title]) => ({ title, media: emptyPhone() })),
      stage: emptyStage(),
      icons: defaultAdIcons(),
      size: "medium",
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
      /** One slide per client: a big poster and up to six counting numbers. */
      slides: z
        .array(
          z
            .object({
              brand: z.string().max(80),
              poster: slotSchema(["1:1", "4:5", "16:10"]),
              /** Optional, e.g. "Last 90 days"; shown under the brand name. */
              period: z.string().max(40),
              /** Optional, e.g. "Meta Ads"; shown under the brand name. */
              source: z.string().max(60),
              /** Shown in the Lower CPA icon (rupee by default). */
              currency: z.string().min(1).max(3),
              metrics: z.array(showcaseMetric).min(1).max(6),
            })
            .default(showcaseSlide("", [null, null, null, null, null, null])),
        )
        .max(12),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "RohTre Media",
      title: "We build growth",
      accent: "that shows.",
      intro: "Strategy. Creative. Technology. All working together for real results.",
      // Names and numbers from the live page's own counters (rohtremedia.com/e-commerce-marketing,
      // Elementor data-to-value + suffix). Posters ship empty; period and source are still owed.
      slides: [
        showcaseSlide("Rama Chikan", [1.5, 28, 12, 49, 17, 20]),
        showcaseSlide("Harmiche", [2.6, 3.2, 2.8, 5.4, 3.1, 1.7]),
      ],
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
      /** The stat's number (about 20 per the brief); null until the founder confirms. Hidden when empty. */
      yearsExperience: z.number().int().min(1).max(9999).nullable(),
      /** Shown right after the number, same size, e.g. "+". */
      yearsSuffix: z.string().max(3).default("+"),
      /** Shown next to the number (wraps under it on narrow screens). */
      yearsLabel: z.string().min(1).max(60).default("years as a digital consultant"),
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
      yearsSuffix: "+",
      yearsLabel: "years as a digital consultant",
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
            /** Approved in the admin; unapproved answers show only while building and never on the live site. */
            approved: z.boolean().default(false),
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
          approved: false,
        },
        {
          q: "Which countries do you work with?",
          a: "We work with brands in India, the USA, the UK, Australia and the UAE.",
          approved: false,
        },
        {
          q: "How much does it cost?",
          a: "It depends on your goals, the channels and your ad budget. After a short discovery call, we send you a proposal.",
          approved: false,
        },
        {
          q: "Do you make the ads and creatives too?",
          a: "Yes. Our team writes the copy and designs the images, videos and reels for your campaigns.",
          approved: false,
        },
        {
          q: "How do we get started?",
          a: "Book a call or send the enquiry form. We’ll talk about your brand and goals, then suggest a plan.",
          approved: false,
        },
        {
          q: "Will I know what my budget is doing?",
          a: "Yes. We report regularly on what your budget is doing and what we’re changing next.",
          approved: false,
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
      /** The extra decorative objects and their pointer drift (the card's basic accents always show). */
      animated: z.boolean().default(true),
    })
    .default({
      animated: true,
      eyebrow: "Ready to unlock growth?",
      title: "Let’s talk",
      accent: "about your brand.",
      text: "Tell us about your brand and goals. We’ll get back to you with a plan.",
      label: "Book a Call",
    }),
});

export type HomeContent = z.infer<typeof homeSchema>;
export const DEFAULT_HOME: HomeContent = homeSchema.parse({});

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => Boolean(v && typeof v === "object" && !Array.isArray(v));

/**
 * One phone screen saved before phone shapes existed (2026-10-22): a
 * non-phone shape (e.g. 16:9 from "+ Add") becomes 9:19.5; an EMPTY 9:16
 * slot (the old default nobody chose) also becomes 9:19.5. Filled 9:16
 * slots keep their shape. `legacy` = the section has no `size` yet, i.e.
 * it was saved before this change; once saved again nothing is touched, so
 * a 9:16 picked later in the admin stays 9:16.
 */
export function upgradePhoneSlot(slot: unknown, legacy: boolean): unknown {
  if (!isObj(slot)) return slot;
  const empty = !slot.publicId;
  const aspect = !isPhoneAspect(slot.aspect) || (legacy && empty && slot.aspect === "9:16") ? "9:19.5" : slot.aspect;
  return { ...slot, aspect };
}

const STAGE_SLOTS = [
  ["left", "Left phone"],
  ["centre", "Centre screen"],
  ["right", "Right phone"],
] as const;

/**
 * Video Ads saved before the stage existed (2026-10-22): the first three
 * old cards that have media move, in order, into Left phone, Centre screen
 * and Right phone (a phone video in the centre becomes a 16:9 screen shown
 * with Fit, so nothing is cropped); the icon row is seeded from the old
 * card titles. Only missing keys are added, so it happens once: after a
 * save the section has `stage` and `icons` and is never touched again. The
 * old `items` stay as they are. `moved` lists what moved.
 */
export function videoAdsStage(ads: Obj): { add: Obj; moved: string[] } {
  const add: Obj = {};
  const moved: string[] = [];
  const items = Array.isArray(ads.items) ? ads.items.filter(isObj) : [];
  if (!("stage" in ads)) {
    const stage: Obj = emptyStage();
    items
      .map((it, i) => ({ m: it.media, i }))
      .filter((x): x is { m: Obj; i: number } => isObj(x.m) && Boolean(x.m.publicId))
      .slice(0, 3)
      .forEach(({ m, i }, k) => {
        const [key, name] = STAGE_SLOTS[k];
        const fit = m.fit ?? "fill";
        stage[key] =
          key === "centre"
            ? isLandscapeAspect(m.aspect)
              ? { ...m, fit }
              : { ...m, aspect: "16:9", fit: "fit" }
            : { ...m, aspect: isPhoneAspect(m.aspect) ? m.aspect : "9:19.5", fit };
        moved.push(`card ${i + 1} → ${name}`);
      });
    add.stage = stage;
  }
  if (!("icons" in ads)) {
    const titles = items.map((it) => it.title).filter((t): t is string => typeof t === "string" && Boolean(t.trim()));
    add.icons =
      titles.length >= 2
        ? titles.slice(0, 6).map((title, i) => ({ title: title.slice(0, 60), icon: adIconFor(title, i) }))
        : defaultAdIcons();
  }
  return { add, moved };
}

/** Older saved content, brought up to date when read (saving in the admin stores the new form). */
function upgrade(input: Obj): Obj {
  const out = { ...input };
  // Who We Serve saved before tags existed (five cards): add each card's tags
  // by title and the sixth card. Once saved with tags it is left alone.
  const serve = input.whoWeServe;
  if (isObj(serve) && Array.isArray(serve.items) && !serve.items.some((it) => isObj(it) && "tags" in it)) {
    const items = serve.items.map((it) => {
      const known = isObj(it) ? SERVICE_CARDS.find((c) => c.title === it.title) : undefined;
      return isObj(it) ? { ...it, tags: known ? [...known.tags] : [] } : it;
    });
    const sixth = SERVICE_CARDS[5];
    if (items.length === 5 && !items.some((it) => isObj(it) && it.title === sixth.title))
      items.push({ ...sixth, tags: [...sixth.tags], logos: [] });
    out.whoWeServe = { ...serve, items };
  }
  // FAQ answers had `status: "draft" | "ready"` instead of `approved`.
  const faq = input.faq;
  if (isObj(faq) && Array.isArray(faq.items)) {
    const items = faq.items.map((f) =>
      isObj(f) && "status" in f && !("approved" in f) ? { ...f, approved: f.status === "ready" } : f,
    );
    out.faq = { ...faq, items };
  }
  // Phone screens: phone shapes only.
  const engage = input.engage;
  if (isObj(engage) && Array.isArray(engage.phones)) {
    const legacy = !("size" in engage);
    out.engage = { ...engage, phones: engage.phones.map((p) => upgradePhoneSlot(p, legacy)) };
  }
  const ads = input.videoAds;
  if (isObj(ads) && Array.isArray(ads.items)) {
    const legacy = !("size" in ads);
    const items = ads.items.map((it) => (isObj(it) ? { ...it, media: upgradePhoneSlot(it.media, legacy) } : it));
    out.videoAds = { ...ads, items, ...videoAdsStage({ ...ads, items }).add };
  }
  return out;
}

/** Parse stored JSON section by section, so one bad section never wipes the others. */
export function parseHome(raw: unknown): HomeContent {
  const input = upgrade(raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(homeSchema.shape) as (keyof HomeContent)[]) {
    const parsed = homeSchema.shape[key].safeParse(input[key]);
    out[key] = parsed.success ? parsed.data : DEFAULT_HOME[key];
  }
  return out as HomeContent;
}
