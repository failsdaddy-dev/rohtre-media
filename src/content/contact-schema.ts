import { z } from "zod";

// The Contact page (/contact), edited in Admin → Contact page and stored like
// Home, About and Careers: one JSON row in public.page_content (key
// "contact"). Every field has a default, so the page renders before anything
// is saved. The hero, the "What happens next" steps, the qualifying line and
// the thank-you text are drafts for the owner to approve; the business types
// and ad-spend ranges are seeds marked "to confirm" by the owner. No
// response-time promise anywhere until the owner confirms one.

const line = (max: number) => z.string().max(max);
/** Internal links, anchors or https links. */
const href = z.string().regex(/^(\/|#|https:\/\/)/, "Start with /, # or https://");
const choices = (max: number) => z.array(line(60).min(1)).min(1).max(max);

export const contactSchema = z.object({
  seo: z
    .object({ title: line(70).min(1), description: line(170).min(1) })
    .default({
      title: "Contact",
      description:
        "Tell RohTre Media about your business and goals. Our team will reply with a plan on WhatsApp or email.",
    }),
  hero: z
    .object({
      eyebrow: line(40),
      title: line(80).min(1),
      /** End of the heading, shown in red. */
      accent: line(60),
      intro: line(300),
    })
    .default({
      eyebrow: "Contact",
      title: "Let’s grow",
      accent: "your brand.",
      intro: "Tell us about your business and goals. Our team will reply with a plan.",
    }),
  steps: z
    .object({
      title: line(60).min(1),
      items: z.array(z.object({ step: line(80).min(1), text: line(240) })).min(1).max(5),
    })
    .default({
      title: "What happens next",
      items: [
        { step: "We review your details", text: "" },
        { step: "We contact you on WhatsApp or email", text: "" },
        { step: "You get a plan for your brand", text: "" },
      ],
    }),
  form: z
    .object({
      title: line(80).min(1),
      /** Keeps job seekers out of the sales inbox. Empty = hidden. */
      qualifier: line(160),
      qualifierLinkLabel: line(30),
      qualifierHref: href,
      businessTypes: choices(15),
      adSpend: choices(10),
      interests: choices(20),
      submitLabel: line(40).min(1),
      thanksTitle: line(80).min(1),
      thanksText: line(300).min(1),
      /** The success state's WhatsApp link (Settings number). Empty = hidden. */
      whatsappLabel: line(40),
    })
    .default({
      title: "Tell us about your business",
      qualifier: "This form is for business enquiries. Looking for a job?",
      qualifierLinkLabel: "See Careers",
      qualifierHref: "/careers",
      businessTypes: ["D2C / Shopify Brand", "YouTube Creator", "Service Business", "Agency", "Other"],
      adSpend: [
        "Not running ads yet",
        "Under ₹50,000",
        "₹50,000 to ₹2,00,000",
        "₹2,00,000 to ₹10,00,000",
        "Above ₹10,00,000",
      ],
      interests: [
        "Shopify Development",
        "Website Development",
        "App Development",
        "AI & Automation",
        "Google Ads",
        "Meta Ads",
        "D2C Marketing",
        "YouTube Growth",
      ],
      submitLabel: "Send my enquiry",
      thanksTitle: "Thank you!",
      thanksText: "Your enquiry has reached our team. We’ll review your details and reply on WhatsApp or email.",
      whatsappLabel: "Chat on WhatsApp",
    }),
  details: z
    .object({
      enabled: z.boolean(),
      title: line(60).min(1),
    })
    .default({ enabled: true, title: "Other ways to reach us" }),
});

export type ContactContent = z.infer<typeof contactSchema>;

export const DEFAULT_CONTACT: ContactContent = contactSchema.parse({});

/** Section by section: a section that fails its check falls back to its default, the rest still loads. */
export function parseContact(raw: unknown): ContactContent {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(contactSchema.shape) as (keyof ContactContent)[]) {
    const parsed = contactSchema.shape[key].safeParse(input[key]);
    out[key] = parsed.success ? parsed.data : DEFAULT_CONTACT[key];
  }
  return out as ContactContent;
}
