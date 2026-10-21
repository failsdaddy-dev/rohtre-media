import { z } from "zod";
import { DEFAULT_AI_BOTS } from "./crawlers";

// Global settings (R8, R9, R12, R38). Stored as one JSON row in
// public.site_settings; anything missing or invalid falls back to these
// defaults, so the site always renders. Defaults come from the live site
// (docs/content/wordpress-inventory.md) and the founder.

const phone = z.object({
  country: z.string().min(2).max(2), // ISO code
  label: z.string().min(1).max(40),
  display: z.string().min(3).max(30),
  tel: z.string().regex(/^\+[0-9]{6,15}$/, "Use +countrycode and digits only"),
});

const social = z.object({
  network: z.enum(["instagram", "youtube", "linkedin", "facebook", "x"]),
  url: z.url().nullable(), // null = placeholder, hidden on the site
});

export const settingsSchema = z.object({
  email: z.email().default("sales@rohtremedia.com"),
  location: z.string().max(120).default("Lucknow, India"),
  address: z.string().max(300).nullable().default(null),
  tagline: z.string().max(120).default("We Make Brands Unstoppable"),
  phones: z
    .array(phone)
    .max(8)
    .default([
      { country: "IN", label: "India", display: "+91 96957 47475", tel: "+919695747475" },
      { country: "US", label: "US & Canada", display: "+1 229 463 2220", tel: "+12294632220" },
    ]),
  /** Countries without a number: "Get a Callback" links to the contact form. */
  callbackCountries: z
    .array(z.object({ country: z.string().length(2), label: z.string().max(40) }))
    .default([{ country: "AE", label: "UAE" }]),
  socials: z.array(social).default([
    { network: "instagram", url: null },
    { network: "youtube", url: null },
    { network: "linkedin", url: null },
    { network: "facebook", url: null },
    { network: "x", url: null },
  ]),
  whatsapp: z
    .object({
      /** Digits only, with country code (wa.me format). From the live site's chat widget. */
      number: z.string().regex(/^[1-9][0-9]{6,14}$/),
      /** Variables: {page}, {service}, {niche}, {country}. */
      template: z.string().min(1).max(300),
      enabled: z.boolean(),
    })
    .default({
      number: "919695747475",
      template: "Hi RohTre Media, I'm on your {page} page and I'd like to know more.",
      enabled: true,
    }),
  /** Careers "Chat with HR" WhatsApp number (from the live Careers page). Digits only. */
  hrWhatsapp: z
    .string()
    .regex(/^[1-9][0-9]{6,14}$/)
    .nullable()
    .default("919670111008"),
  /** R12: "Looking for a job? See Careers" line near the form on landing pages. */
  careersLineEnabled: z.boolean().default(true),
  /** R24: lets the owner publish (developer-only by default). */
  founderCanPublish: z.boolean().default(false),
  /** R38: leads older than this are deleted. */
  leadRetentionDays: z.number().int().min(30).max(3650).default(730),
  adSpendRanges: z
    .array(z.string().min(1).max(60))
    .min(1)
    .max(10)
    .default([
      "Not running ads yet",
      "Under ₹50,000 / month",
      "₹50,000 – ₹2 lakh / month",
      "₹2 – 10 lakh / month",
      "Over ₹10 lakh / month",
    ]),
  interests: z
    .array(z.string().min(1).max(60))
    .min(1)
    .max(15)
    .default([
      "Meta ads",
      "Google Ads",
      "D2C / e-commerce growth",
      "Social media",
      "YouTube & video",
      "Website",
      "Shopify development",
      "AI automation",
      "Something else",
    ]),
  /** Legal details for the Privacy Notice and Terms. Empty = shown as a placeholder. */
  legal: z
    .object({
      companyName: z.string().max(160).nullable(),
      companyType: z.string().max(80).nullable(),
      registeredAddress: z.string().max(300).nullable(),
      privacyContactName: z.string().max(120).nullable(),
      privacyEmail: z.email().nullable(),
      jurisdictionCity: z.string().max(80).nullable(),
    })
    .default({
      companyName: null,
      companyType: null,
      registeredAddress: null,
      privacyContactName: null,
      privacyEmail: null,
      jurisdictionCity: null,
    }),
  /** R42: AI crawlers kept away from unlisted pages (robots.txt and a 403). */
  aiBots: z
    .array(z.string().regex(/^[A-Za-z0-9._-]{2,60}$/, "Letters, digits, dot, dash or underscore only"))
    .max(60)
    .default([...DEFAULT_AI_BOTS]),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: SiteSettings = settingsSchema.parse({});

/** Parse stored JSON key by key, so one bad value never wipes the others. */
export function parseSettings(raw: unknown): SiteSettings {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(settingsSchema.shape) as (keyof SiteSettings)[]) {
    const field = settingsSchema.shape[key];
    const parsed = field.safeParse(input[key]);
    out[key] = parsed.success ? parsed.data : DEFAULT_SETTINGS[key];
  }
  return out as SiteSettings;
}
