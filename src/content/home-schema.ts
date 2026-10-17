import { z } from "zod";

// Home page content (R13, R14). Stored as JSON in public.page_content
// (key "home"), checked here. Any section that is missing or invalid falls
// back to its default on its own, so the page always renders. Phase 4's
// admin edits exactly these fields.

export const mediaSchema = z.object({
  publicId: z.string().regex(/^rohtre-media\/[A-Za-z0-9_./-]+$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type Media = z.infer<typeof mediaSchema>;

/** Text for the Book a Call strip that follows a section (R13). */
const cta = z.object({ text: z.string().max(140), label: z.string().min(1).max(40) });

const slide = z.object({
  /** Finished image with the text baked in. Desktop about 1920×800, mobile about 1080×1350. */
  desktop: mediaSchema.nullable(),
  mobile: mediaSchema.nullable(),
  alt: z.string().max(250),
  /** Optional link when the slide is clicked. */
  href: z.string().startsWith("/").nullable(),
});

export const homeSchema = z.object({
  hero: z
    .object({
      slides: z.array(slide).length(2), // R14: exactly two
      h1: z.string().min(1).max(120),
      subline: z.string().max(240),
      ctaLabel: z.string().min(1).max(40),
    })
    .default({
      slides: [
        { desktop: null, mobile: null, alt: "", href: null },
        { desktop: null, mobile: null, alt: "", href: null },
      ],
      h1: "We make brands unstoppable.",
      subline: "Meta ads, Google Ads, scroll-stopping creatives and websites for brands that want to grow.",
      ctaLabel: "Book a Call",
    }),

  badges: z
    .object({ enabled: z.boolean(), cta })
    .default({ enabled: true, cta: { text: "Want results like these for your brand?", label: "Book a Call" } }),

  services: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(140),
      intro: z.string().max(400),
      items: z
        .array(
          z.object({
            title: z.string().min(1).max(60),
            text: z.string().max(240),
            href: z.string().startsWith("/").nullable(),
          }),
        )
        .max(12),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Services",
      title: "See what we’ll do to build your brand.",
      intro: "Everything you need to get more customers, from the first ad to the page it lands on.",
      items: [
        {
          title: "Meta ads",
          text: "Facebook and Instagram campaigns built around scroll-stopping creative, sharp targeting and constant optimisation.",
          href: null,
        },
        {
          title: "Google Ads",
          text: "Search, Shopping, Performance Max and YouTube campaigns that reach people when they’re ready to buy.",
          href: null,
        },
        {
          title: "D2C & e-commerce growth",
          text: "Full-funnel growth for direct-to-consumer brands: ads, creatives, landing pages and retention working together.",
          href: null,
        },
        {
          title: "Social media",
          text: "Content calendars, posts and community management that keep your brand active and on-message.",
          href: null,
        },
        {
          title: "YouTube & video",
          text: "Video ads, reels and YouTube content made by our own video production team.",
          href: null,
        },
        {
          title: "Websites",
          text: "Fast, conversion-focused websites and landing pages that turn visitors into leads.",
          href: null,
        },
        {
          title: "Content",
          text: "Copy, graphics and motion design that make your brand look and sound the same everywhere.",
          href: null,
        },
        {
          title: "Shopify development",
          text: "Shopify store setup, themes and improvements that make buying easy.",
          href: null,
        },
        {
          title: "AI automation",
          text: "AI tools and automations for content, lead follow-up and reporting, so your team saves time.",
          href: null,
        },
      ],
      cta: { text: "Not sure which service fits?", label: "Ask us on a call" },
    }),

  results: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(140),
      intro: z.string().max(400),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Results",
      title: "Ads that build brands.",
      intro: "Real numbers from real campaigns, with the dashboards to prove them.",
      cta: { text: "Let’s plan your numbers.", label: "Book a Call" },
    }),

  process: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
      title: z.string().max(140),
      steps: z
        .array(z.object({ title: z.string().min(1).max(60), text: z.string().max(200) }))
        .min(1)
        .max(5),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "How we work",
      title: "From first call to growing sales.",
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
      title: z.string().max(140),
      variant: z.enum(["grid", "slider"]), // R27
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "Testimonials",
      title: "Hear what clients say about RohTre Media.",
      variant: "grid",
      cta: { text: "Want to be our next success story?", label: "Book a Call" },
    }),

  founder: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string().max(60),
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
      title: z.string().max(140),
      items: z
        .array(
          z.object({
            q: z.string().min(1).max(200),
            a: z.string().min(1).max(1200),
            /** Drafts show while building but never on the live site until approved. */
            status: z.enum(["draft", "ready"]),
          }),
        )
        .max(15),
      cta,
    })
    .default({
      enabled: true,
      eyebrow: "FAQ",
      title: "Questions brands ask us.",
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
      text: z.string().max(240),
      label: z.string().min(1).max(40),
    })
    .default({
      eyebrow: "Ready to unlock growth?",
      title: "Let’s talk!",
      text: "Tell us about your brand. We’ll get back to you with a plan.",
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
