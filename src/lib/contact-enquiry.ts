import { z } from "zod";

// One Contact page enquiry: the same rules in the browser (instant errors)
// and on the server (the real check). The dropdown and chip choices come
// from Admin → Contact page; the server also checks against the saved lists.
// Saved in public.leads like every other lead (page_path "/contact").

export { DIAL_CODES } from "./career-application";

export const CONTACT_CONSENT_TEXT =
  "I agree that RohTre Media may store my details and contact me about this enquiry.";
/** Stored with each enquiry (leads.consent_text_version). Change it whenever the wording changes. */
export const CONTACT_CONSENT_VERSION = "contact-2026-10-24";
export const MESSAGE_MAX = 1000;
/** Minimum time a person needs to fill the form. Faster = a bot. */
export const CONTACT_MIN_FILL_MS = 3000;

/** Anything that looks like an HTML tag is removed; the rest is plain text. */
const plain = (v: string) => v.replace(/<[^>]*>/g, "").trim();
const text = (max: number) => z.string().transform(plain).pipe(z.string().max(max));

/** "example.com" → "https://example.com"; empty stays empty; anything that isn't a web address is null. */
export function normalizeWebsite(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol) || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)) return null;
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const enquirySchema = z.object({
  fullName: text(80).pipe(z.string().min(2, "Enter your full name.")),
  dialCode: z.string().regex(/^\+[0-9]{1,4}$/, "Choose a country code."),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^[0-9]{6,14}$/, "Enter a valid WhatsApp or phone number (digits only).")),
  email: z.string().trim().pipe(z.email("Enter a valid email address.").max(120)),
  businessType: text(60),
  website: z
    .string()
    .max(300)
    .transform((v, ctx) => {
      const out = normalizeWebsite(v);
      if (out === null) {
        ctx.addIssue({ code: "custom", message: "Enter a website like yourbrand.com" });
        return z.NEVER;
      }
      return out;
    }),
  adSpend: text(60),
  interests: z.array(text(60)).max(20),
  message: text(MESSAGE_MAX + 50).pipe(z.string().max(MESSAGE_MAX, `Keep the message under ${MESSAGE_MAX} characters.`)),
  consent: z.literal(true, { error: "Please tick the box to agree." }),
  /** Honeypot: hidden from people, bots fill it. */
  fax: z.string().max(200).optional(),
  /** When the visitor opened the form (ms). Spam signal, not stored. */
  startedAt: z.number().int().nonnegative(),
  attribution: z.record(z.string(), z.string().max(500)).default({}),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

/** The full phone number, e.g. +919876543210. */
export const enquiryPhone = (e: Pick<Enquiry, "dialCode" | "phone">) => `${e.dialCode}${e.phone.replace(/^0+/, "")}`;
