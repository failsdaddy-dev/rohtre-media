import { headlineFor, isCustomValue, nichePhrase, promptText, type PageDims } from "../lib/dimensions";
import { nicheCopy } from "./niche-copy";
import { pageContentSchema, type PageContent, type Section } from "./schemas";

// The master template (R28): the default sections, in the Gate 0 order (R15),
// for a new landing page. Editors then switch sections on/off, reorder them
// and rewrite the copy per page. The copy here is light, generic starter copy
// (no client names, numbers, results or promises: rule 4 / R30); FAQ answers
// start as drafts so they are rewritten for the page before publishing (R17).
// The angle follows the service's channels (R21): Meta-only pages lead with
// reels and creative, Google-only pages with search intent, D2C (both) mixes.
// Niches with their own starter copy (niche-copy.ts) get their own hero line,
// pain points and FAQs; every page gets a FAQ for its country (currency).
// Custom services and niches added in the admin use the same sections, but
// text we can't know for them starts as an "[Add ... here]" prompt, which is
// left off the live page until it is replaced.

/** Lowercase a custom niche, leaving words like "SaaS" or "D2C" as typed. */
const lowerUnlessAcronym = (s: string) => (/[A-Z]{2}|[a-z][A-Z]/.test(s) ? s : s.toLowerCase());

type Channel = "meta" | "google";

function channelsOf(dims: Pick<PageDims, "service">): Channel[] {
  const raw = (dims.service.attrs as { channels?: unknown }).channels;
  const list = Array.isArray(raw) ? raw.filter((c): c is Channel => c === "meta" || c === "google") : [];
  return list.length ? list : ["meta", "google"];
}

const PLATFORMS: Record<Channel, { name: string; text: string }[]> = {
  meta: [
    { name: "Facebook", text: "Feed, Stories and Reels placements, built around your best-selling products." },
    { name: "Instagram", text: "Reels and Stories that look native to the feed, not like ads." },
  ],
  google: [
    { name: "Google Search", text: "Show up when people search for exactly what you sell." },
    { name: "Shopping & Performance Max", text: "Your products, prices and images in front of ready-to-buy shoppers." },
    { name: "YouTube", text: "Video ads that build demand before people start searching." },
  ],
};

const PAIN_POINTS: Record<"meta" | "google" | "both", { title: string; text: string }[]> = {
  meta: [
    {
      title: "Cost per purchase keeps climbing",
      text: "The same ads that worked last month now cost more for every sale.",
    },
    { title: "Creatives burn out fast", text: "Ads fatigue in days, and there's never enough fresh content to test." },
    { title: "Scaling breaks performance", text: "Raise the budget and the results drop, so growth stalls." },
  ],
  google: [
    { title: "Spend goes to the wrong searches", text: "Budget leaks into broad, low-intent searches that never buy." },
    {
      title: "Shopping ads don't stand out",
      text: "Your products sit next to competitors with no reason to click yours.",
    },
    {
      title: "You can't see what's working",
      text: "Tracking gaps make it hard to know which campaigns actually sell.",
    },
  ],
  both: [
    {
      title: "Channels work against each other",
      text: "Meta and Google are run separately, so budget and messages don't add up.",
    },
    { title: "Creatives burn out fast", text: "Ads fatigue in days, and there's never enough fresh content to test." },
    { title: "Growth stalls when you scale", text: "More budget doesn't bring more profitable sales." },
  ],
};

export function masterTemplate(dims: Pick<PageDims, "service" | "niche" | "country">): PageContent {
  const channels = channelsOf(dims);
  const angle = channels.length === 1 ? channels[0] : "both";
  const service = dims.service.headline_label;
  const customService = isCustomValue(dims.service);
  const customNiche = isCustomValue(dims.niche);
  const needsPrompts = customService || customNiche;
  const niche = customNiche ? lowerUnlessAcronym(dims.niche.headline_label) : dims.niche.headline_label.toLowerCase();
  const nicheBrands = customNiche ? lowerUnlessAcronym(nichePhrase(dims.niche)) : `${niche} brands`;
  const yourBrand = dims.niche.attrs.noBrands === true ? "your business" : `your ${niche} brand`;
  const country = dims.country.headline_label;
  const h1 = headlineFor(dims).slice(0, 120);
  const copy = customNiche ? null : nicheCopy(dims.niche.slug);
  const currency = (dims.country.attrs as { currency?: unknown }).currency;
  const countryFaq = {
    q: `Can you run campaigns for buyers in ${country}?`,
    a: `Yes. We target buyers in ${country}${typeof currency === "string" ? `, plan your ad budget in ${currency}` : ""} and report on the numbers that matter for your business there.`,
    status: "draft" as const,
  };

  const sections: Section[] = [
    {
      id: "hero",
      type: "hero",
      variant: "banner-right",
      enabled: true,
      props: {
        eyebrow: `${dims.service.label} · ${dims.niche.label}`.slice(0, 60),
        h1,
        subline: needsPrompts
          ? promptText("the hero text")
          : `${service} for ${nicheBrands} in ${country}: ${copy?.subline ?? "scroll-stopping creatives, sharp targeting and campaigns built to grow your sales."}`,
        ctaLabel: "Book a Call",
        offerBanner: { desktop: null, mobile: null, alt: "" },
      },
    },
    {
      id: "badges",
      type: "badges",
      variant: "bar",
      enabled: true,
      props: { eyebrow: "Partners & recognition", badgeIds: [] },
    },
    {
      id: "pain-points",
      type: "painPoints",
      variant: "cards",
      enabled: true,
      props: {
        eyebrow: "Sound familiar?",
        title: customNiche ? `Growing ${yourBrand}` : `Growing a ${niche} brand`,
        accent: "shouldn’t feel like this.",
        items: needsPrompts
          ? [1, 2, 3].map((n) => ({
              title: promptText(`pain point ${n}`),
              text: promptText(`the detail for pain point ${n}`),
            }))
          : (copy?.painPoints ?? PAIN_POINTS[angle]),
      },
    },
    {
      id: "results",
      type: "results",
      variant: "stack",
      enabled: true,
      props: {
        eyebrow: "Results",
        title: "Real numbers,",
        accent: "real dashboards.",
        intro: `What we’ve done for brands like yours, with the dashboards to prove it.`,
        uploads: [],
        limit: 3,
        cta: { text: "Let’s plan your numbers.", label: "Book a Call" },
      },
    },
    {
      id: "creatives",
      type: "creatives",
      variant: angle === "google" ? "images-first" : "reels-first",
      enabled: true,
      props: {
        eyebrow: "Our work",
        title: angle === "google" ? "Ads built" : "Creatives that",
        accent: angle === "google" ? "for the search." : "stop the scroll.",
        intro: "Real ads and creatives from our team.",
        media: [],
        limit: 6,
        showConcept: false,
      },
    },
    {
      id: "platforms",
      type: "platforms",
      variant: "cards",
      enabled: true,
      props: {
        eyebrow: "Where we run your ads",
        title: "The platforms",
        accent: "your customers use.",
        items: customService
          ? [1, 2].map((n) => ({
              name: promptText(`platform ${n}`),
              text: promptText(`the text for platform ${n}`),
            }))
          : channels.flatMap((c) => PLATFORMS[c]),
      },
    },
    {
      id: "testimonials",
      type: "testimonials",
      variant: "slider",
      enabled: true,
      props: {
        eyebrow: "Testimonials",
        title: "What clients",
        accent: "say about us.",
        cta: { text: "Want to be our next success story?", label: "Book a Call" },
      },
    },
    {
      id: "process",
      type: "process",
      variant: "timeline",
      enabled: false, // R15: process is minimal and optional
      props: {
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
      },
    },
    {
      id: "faq",
      type: "faq",
      variant: "two-column",
      enabled: true,
      props: {
        eyebrow: "FAQ",
        title: "Questions",
        accent: `${nicheBrands} ask us.`.slice(0, 60),
        items: [
          {
            q: `Do you work with ${nicheBrands} in ${country}?`,
            a: `Yes. Tell us about your brand on a short call and we’ll show you how we’d approach ${dims.service.label.toLowerCase()} for it.`,
            status: "draft",
          },
          ...(copy?.faq ?? []).map((f) => ({ ...f, status: "draft" as const })),
          countryFaq,
          {
            q: "Do you make the ads and creatives too?",
            a: "Yes. Our team writes the copy and designs the images, videos and reels for your campaigns.",
            status: "draft",
          },
          {
            q: "How much does it cost?",
            a: "It depends on your goals and ad budget. After a short discovery call, we send you a proposal.",
            status: "draft",
          },
          {
            q: "How do we get started?",
            a: "Book a call or send the form below. We’ll talk about your brand and goals, then suggest a plan.",
            status: "draft",
          },
        ],
        cta: { text: "Still have a question?", label: "Ask us directly" },
      },
    },
    {
      id: "form",
      type: "form",
      variant: "split",
      enabled: true,
      props: {
        eyebrow: "Get started",
        title: "Let’s grow",
        accent: "your brand.",
        intro: copy?.formIntro ?? `Tell us about ${yourBrand}. We’ll get back to you with a plan.`,
        formTitle: "Book your discovery call",
        defaultInterest: customService
          ? ""
          : angle === "meta"
            ? "Meta ads"
            : angle === "google"
              ? "Google Ads"
              : "D2C / e-commerce growth",
      },
    },
  ];

  return pageContentSchema.parse({
    meta: {
      title: (h1.length <= 60 ? h1 : `${service} for ${nichePhrase(dims.niche)}`).slice(0, 70),
      description:
        `${service} for ${nicheBrands} in ${country}. Creatives, targeting and campaigns built to grow your sales. Book a call with RohTre Media.`.slice(
          0,
          160,
        ),
    },
    sections,
  });
}
