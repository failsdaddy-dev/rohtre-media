import { z } from "zod";
import { CAREER_CATEGORIES } from "@/content/careers-schema";

// One careers application: the same rules in the browser (instant errors)
// and on the server (the real check). Roles and experience options come
// from Admin → Careers page; the server checks against the saved lists.

/** Resume: optional, sent to HR as an email attachment (never stored). 4 MB keeps it under the host's request limit. */
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;
export const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
export const OTHER_ROLE = "Other";
/** Inbox statuses (Admin → Applications). */
export const APPLICATION_STATUSES = ["new", "contacted", "rejected", "hired"] as const;

/** Country calling codes offered next to the phone number (India first). */
export const DIAL_CODES = [
  { code: "+91", country: "IN", name: "India" },
  { code: "+1", country: "US", name: "USA & Canada" },
  { code: "+971", country: "AE", name: "United Arab Emirates" },
  { code: "+44", country: "GB", name: "United Kingdom" },
  { code: "+61", country: "AU", name: "Australia" },
  { code: "+65", country: "SG", name: "Singapore" },
  { code: "+977", country: "NP", name: "Nepal" },
  { code: "+880", country: "BD", name: "Bangladesh" },
] as const;

export const CONSENT_TEXT = "I agree that RohTre Media may store my details and contact me about this application.";

export const applicationSchema = z
  .object({
    category: z.enum(CAREER_CATEGORIES, { error: "Choose Internship or Full-time." }),
    fullName: z.string().trim().min(2, "Enter your full name.").max(80),
    email: z.email("Enter a valid email address.").max(120),
    dialCode: z.string().regex(/^\+[0-9]{1,4}$/, "Choose a country code."),
    phone: z
      .string()
      .transform((v) => v.replace(/[\s()-]/g, ""))
      .pipe(z.string().regex(/^[0-9]{6,14}$/, "Enter a valid phone/WhatsApp number (digits only).")),
    role: z.string().trim().min(1, "Choose a role.").max(60),
    otherRole: z.string().trim().max(60).optional(),
    experience: z.string().trim().min(1, "Choose your experience.").max(30),
    portfolio: z
      .string()
      .trim()
      .max(300)
      .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/.test(v), "Enter a full link starting with https://")
      .optional(),
    message: z.string().trim().max(1500).optional(),
    consent: z.literal(true, { error: "Please tick the box to agree." }),
    /** Honeypot: hidden from people, bots fill it. */
    fax: z.string().max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.role === OTHER_ROLE && !v.otherRole)
      ctx.addIssue({ code: "custom", path: ["otherRole"], message: "Tell us which role." });
  });

export type Application = z.infer<typeof applicationSchema>;

/** The full phone number, e.g. +919876543210. */
export const fullPhone = (a: Pick<Application, "dialCode" | "phone">) => `${a.dialCode}${a.phone.replace(/^0+/, "")}`;
export const roleOf = (a: Pick<Application, "role" | "otherRole">) =>
  a.role === OTHER_ROLE ? `Other: ${a.otherRole ?? ""}` : a.role;

/** Checks a resume's first bytes: PDF (%PDF), old Word (OLE) or DOCX (zip). */
export function resumeLooksValid(bytes: Uint8Array, mime: string): boolean {
  const ext = RESUME_TYPES[mime];
  if (!ext) return false;
  const start = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (ext === "pdf") return start([0x25, 0x50, 0x44, 0x46]);
  if (ext === "doc") return start([0xd0, 0xcf, 0x11, 0xe0]);
  return start([0x50, 0x4b, 0x03, 0x04]);
}
