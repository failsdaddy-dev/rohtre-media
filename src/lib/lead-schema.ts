import { z } from "zod";

// One lead form for the whole site (R10): the same fields, the same checks in
// the browser and on the server.

export { CONSENT_TEXT, CONSENT_VERSION } from "./consent";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 ()-]{5,22}$/, "Please enter a valid phone or WhatsApp number"),
  email: z.email("Please enter a valid email").max(254),
  businessType: optional(120),
  website: optional(300),
  adSpendRange: optional(80),
  interest: optional(80),
  message: optional(2000),
  consent: z.literal(true, { error: "Please tick the box so we can contact you" }),
  pagePath: z.string().trim().startsWith("/").max(500),
  attribution: z.record(z.string(), z.string().max(500)).default({}),
  // Spam signals (not stored)
  fax: z.string().max(200).optional(), // honeypot: hidden from people, bots fill it
  startedAt: z.number().int().nonnegative(),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

/** Minimum time a person needs to fill the form. Faster = a bot. */
export const MIN_FILL_MS = 3000;

/** Pure spam decision, so it can be unit-tested. */
export function looksLikeSpam(lead: Pick<Lead, "fax" | "startedAt">, now: number): boolean {
  if (lead.fax && lead.fax.trim() !== "") return true;
  if (now - lead.startedAt < MIN_FILL_MS) return true;
  if (lead.startedAt > now + 60_000) return true; // clock from the future
  return false;
}
