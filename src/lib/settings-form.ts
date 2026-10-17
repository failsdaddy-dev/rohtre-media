import { settingsSchema, type SiteSettings } from "./settings-schema";

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
    socials: current.socials.map((s) => ({ network: s.network, url: str(`social_${s.network}`) || null })),
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
  };
  const parsed = settingsSchema.safeParse(raw);
  if (parsed.success) return { ok: true, settings: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] === "whatsapp" ? `whatsapp.${String(issue.path[1])}` : String(issue.path[0]);
    const where = typeof issue.path[1] === "number" ? ` (line ${issue.path[1] + 1})` : "";
    errors[key] ??= `${issue.message}${where}`;
  }
  return { ok: false, errors };
}
