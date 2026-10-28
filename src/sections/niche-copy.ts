// Niche starter copy for new landing pages (2026-10-27). The master template
// uses it when a page is created for one of these niches (a sub-niche uses
// its parent's, e.g. Clothing → Fashion): the hero line, the three pain points
// and two extra FAQ answers (drafts, rewritten per page before publishing,
// R17). Same rules as the master template: no client names, numbers, results
// or promises (rule 4 / R30). Any other niche keeps the generic copy.

export type NicheCopy = {
  /** Follows "Meta Ads for fashion brands in India: " in the hero. */
  subline: string;
  painPoints: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  /** The enquiry form's intro line. */
  formIntro: string;
};

const COPY: Record<string, NicheCopy> = {
  fashion: {
    subline: "lookbook-style creatives, new-drop launches and campaigns that turn browsers into buyers.",
    painPoints: [
      {
        title: "Every drop needs fresh creative",
        text: "New collections land every few weeks and the ads can’t keep up.",
      },
      {
        title: "Returns eat into every sale",
        text: "Wrong-size orders and impulse buys make good-looking numbers less profitable.",
      },
      {
        title: "Big brands outspend you",
        text: "Marketplaces and large labels crowd the feed during every sale season.",
      },
    ],
    faq: [
      {
        q: "Can you plan ads around our new drops and sale seasons?",
        a: "Yes. We build a calendar around your launches and festive or sale periods, with creatives ready before each one.",
      },
      {
        q: "Do you shoot product and model content?",
        a: "Yes. We plan and make product shots, try-ons and reels that suit your catalogue and your audience.",
      },
    ],
    formIntro: "Tell us about your collections and goals. We’ll get back to you with a plan.",
  },
  lifestyle: {
    subline: "content that shows your products in real life, and campaigns that build a loyal community.",
    painPoints: [
      {
        title: "Your products need a story",
        text: "Plain product ads don’t show how your brand fits into people’s lives.",
      },
      {
        title: "Customers buy once and drift away",
        text: "Without a reason to come back, every sale costs as much as the first.",
      },
      {
        title: "Too many channels, no clear plan",
        text: "Instagram, YouTube and search all need different content, and it’s hard to keep up.",
      },
    ],
    faq: [
      {
        q: "Do you work with influencers and creators?",
        a: "Yes. We can plan creator content alongside your ads so both tell the same story.",
      },
      {
        q: "Can you help bring past customers back?",
        a: "Yes. We set up campaigns for people who already know your brand, with offers and content made for them.",
      },
    ],
    formIntro: "Tell us about your lifestyle brand and goals. We’ll get back to you with a plan.",
  },
  health: {
    subline: "trust-first creatives and campaigns that follow ad-platform health rules.",
    painPoints: [
      {
        title: "Ads get rejected",
        text: "Health and wellness ads face strict platform rules, and one rejection can stall a launch.",
      },
      {
        title: "Buyers need proof before they trust you",
        text: "People want to know what’s in it and who stands behind it before they buy.",
      },
      {
        title: "One-time buyers don’t come back",
        text: "Without reminders and refills, customers drop off after the first order.",
      },
    ],
    faq: [
      {
        q: "Do you know the ad rules for health products?",
        a: "Yes. We write and design within Meta and Google health policies, so your ads stay live and your claims stay safe.",
      },
      {
        q: "Can you set up refill and repeat-order campaigns?",
        a: "Yes. We plan campaigns that reach customers when it’s time to reorder.",
      },
    ],
    formIntro: "Tell us about your health brand and goals. We’ll get back to you with a plan.",
  },
  "real-estate": {
    subline: "project films, sharp location targeting and lead campaigns that bring serious buyers.",
    painPoints: [
      {
        title: "Lots of leads, few site visits",
        text: "Forms fill up with people who were never ready to buy.",
      },
      {
        title: "Projects look the same in ads",
        text: "Standard renders and brochures don’t show why your project is different.",
      },
      {
        title: "Leads go cold before sales calls",
        text: "Slow follow-up means interested buyers move on to the next project.",
      },
    ],
    faq: [
      {
        q: "Can you target buyers in a specific city or area?",
        a: "Yes. We target by location, interest and intent, and can focus on people looking to buy near your project.",
      },
      {
        q: "Do you make walkthrough videos and project films?",
        a: "Yes. We plan and make project films, walkthroughs and reels from your site, renders and amenities.",
      },
    ],
    formIntro: "Tell us about your project and goals. We’ll get back to you with a plan.",
  },
  saas: {
    subline: "clear product creatives and campaigns that bring sign-ups, demos and trials.",
    painPoints: [
      {
        title: "Clicks don’t turn into sign-ups",
        text: "People visit, look around and leave without starting a trial or booking a demo.",
      },
      {
        title: "Your product is hard to show in an ad",
        text: "Software doesn’t sell itself in a few seconds without the right visuals.",
      },
      {
        title: "Cost per demo keeps rising",
        text: "Competitors bid on the same keywords and audiences every month.",
      },
    ],
    faq: [
      {
        q: "Do you run campaigns for demos and free trials?",
        a: "Yes. We build campaigns around the action you want, whether that’s a demo call, a free trial or a sign-up.",
      },
      {
        q: "Can you make product demo videos?",
        a: "Yes. We make short product videos and screen-led creatives that explain what your software does.",
      },
    ],
    formIntro: "Tell us about your product and goals. We’ll get back to you with a plan.",
  },
  "event-management": {
    subline: "event teasers, countdown campaigns and ads that fill seats and bring enquiries.",
    painPoints: [
      {
        title: "Tickets sell at the last minute",
        text: "Most bookings come in the final days, which makes planning hard.",
      },
      {
        title: "Every event starts from zero",
        text: "Audiences from past events aren’t reused, so each launch costs more.",
      },
      {
        title: "Your best work isn’t on screen",
        text: "Great events happen, but there’s little content to show the next client.",
      },
    ],
    faq: [
      {
        q: "Can you promote a single event with a fixed date?",
        a: "Yes. We plan teaser, launch and countdown phases so your campaign builds up to the date.",
      },
      {
        q: "Do you make highlight reels from past events?",
        a: "Yes. We turn your event footage into reels and ads that show what people can expect.",
      },
    ],
    formIntro: "Tell us about your events and goals. We’ll get back to you with a plan.",
  },
};

/** Sub-niches that use their parent's copy. */
const PARENT: Record<string, string> = {
  clothing: "fashion",
  shoes: "fashion",
  jewellery: "fashion",
  "ethnic-wear": "fashion",
  "bags-accessories": "fashion",
  watches: "fashion",
  "health-wellness": "health",
  supplements: "health",
  ayurveda: "health",
};

/** The starter copy for a niche slug (or its parent's), or null for the generic copy. */
export function nicheCopy(slug: string): NicheCopy | null {
  return COPY[slug] ?? COPY[PARENT[slug] ?? ""] ?? null;
}
