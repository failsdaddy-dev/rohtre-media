import { settingsSchema, type SiteSettings } from "./settings-schema";
import { safeSocialUrl, SOCIAL_NETWORKS, socialUrlError, type SocialLink, type SocialNetwork } from "./social-links";

// Turns the admin settings form into a settings object and back. Lists are
// edited one item per line; phones as "IN | India | +91 96957 47475 | +919695747475".

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const cells = (l: string) => l.split("|").map((c) => c.trim());

export function phonesToText(s: SiteSettings) {
  return s.phones.map((p) => [p.country, p.label, p.display, p.tel].join(" | ")).join("\n");
}
export function callbacksToText(s: SiteSettings) {
  return s.callbackCountries.map((c) => [c.country, c.label].join(" | ")).join("\n");
}

/**
 * Social link rows, posted as socials.{i}.network / .url / .enabled (the
 * platform comes from the Select's hidden input) plus socialsCount.
 */
function socialRows(f: FormData): SocialLink[] {
  const n = Math.min(Number(f.get("socialsCount")) || 0, 16);
  return Array.from({ length: n }, (_, i) => {
    const url = String(f.get(`socials.${i}.url`) ?? "").trim();
    return {
      network: String(f.get(`socials.${i}.network`) ?? "") as SocialNetwork,
      url: url ? (safeSocialUrl(url) ?? url) : null,
      enabled: f.get(`socials.${i}.enabled`) === "on",
    };
  });
}

export type FormResult = { ok: true; settings: SiteSettings } | { ok: false; errors: Record<string, string> };

export function settingsFromForm(f: FormData, current: SiteSettings, isOwner: boolean): FormResult {
  const str = (k: string) => String(f.get(k) ?? "").trim();
  const raw = {
    email: str("email"),
    location: str("location"),
    address: str("address") || null,
    tagline: str("tagline"),
    phones: lines(f.get("phones")).map((l) => {
      const [country = "", label = "", display = "", tel = ""] = cells(l);
      return { country: country.toUpperCase(), label, display, tel: tel.replace(/[^\d+]/g, "") };
    }),
    callbackCountries: lines(f.get("callbackCountries")).map((l) => {
      const [country = "", label = ""] = cells(l);
      return { country: country.toUpperCase(), label };
    }),
    socials: f.has("socialsCount") ? socialRows(f) : current.socials,
    whatsapp: {
      number: str("whatsappNumber").replace(/\D/g, ""),
      template: str("whatsappTemplate"),
      enabled: f.get("whatsappEnabled") === "on",
    },
    hrWhatsapp: str("hrWhatsapp").replace(/\D/g, "") || null,
    careersLineEnabled: f.get("careersLineEnabled") === "on",
    founderCanPublish: isOwner ? f.get("founderCanPublish") === "on" : current.founderCanPublish,
    leadRetentionDays: Number(str("leadRetentionDays")),
    adSpendRanges: lines(f.get("adSpendRanges")),
    interests: lines(f.get("interests")),
    legal: {
      companyName: str("legalCompanyName") || null,
      companyType: str("legalCompanyType") || null,
      registeredAddress: str("legalAddress") || null,
      privacyContactName: str("legalPrivacyName") || null,
      privacyEmail: str("legalPrivacyEmail") || null,
      jurisdictionCity: str("legalJurisdiction") || null,
    },
    aiBots: f.has("aiBots") ? [...new Set(lines(f.get("aiBots")))] : current.aiBots,
  };
  const errors: Record<string, string> = {};
  // Social links must be https (the footer checks again before showing one).
  raw.socials.forEach((s, i) => {
    const problem = SOCIAL_NETWORKS.includes(s.network) ? socialUrlError(s.network, s.url) : "Choose a platform.";
    if (problem) errors[`socials.${i}`] = problem;
  });
  const parsed = settingsSchema.safeParse(raw);
  if (parsed.success && Object.keys(errors).length === 0) return { ok: true, settings: parsed.data };
  if (parsed.success) return { ok: false, errors };
  for (const issue of parsed.error.issues) {
    const nested = issue.path[0] === "whatsapp" || issue.path[0] === "legal";
    const key = nested ? `${String(issue.path[0])}.${String(issue.path[1])}` : String(issue.path[0]);
    const where = typeof issue.path[1] === "number" ? ` (line ${issue.path[1] + 1})` : "";
    errors[key] ??= `${issue.message}${where}`;
  }
  return { ok: false, errors };
}
