import { describe, expect, it } from "vitest";
import { callbacksToText, phonesToText, settingsFromForm } from "../src/lib/settings-form";
import { DEFAULT_SETTINGS, parseSettings } from "../src/lib/settings-schema";

function form(over: Record<string, string> = {}) {
  const s = DEFAULT_SETTINGS;
  const f = new FormData();
  const base: Record<string, string> = {
    email: s.email,
    location: s.location,
    tagline: s.tagline,
    phones: phonesToText(s),
    callbackCountries: callbacksToText(s),
    whatsappNumber: s.whatsapp.number,
    whatsappTemplate: s.whatsapp.template,
    whatsappEnabled: "on",
    hrWhatsapp: s.hrWhatsapp ?? "",
    careersLineEnabled: "on",
    leadRetentionDays: String(s.leadRetentionDays),
    adSpendRanges: s.adSpendRanges.join("\n"),
    interests: s.interests.join("\n"),
    ...over,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}

describe("settings defaults and parsing", () => {
  it("defaults carry the live-site contact details", () => {
    expect(DEFAULT_SETTINGS.email).toBe("sales@rohtremedia.com");
    expect(DEFAULT_SETTINGS.whatsapp.number).toBe("919695747475");
    expect(DEFAULT_SETTINGS.socials.every((s) => s.url === null)).toBe(true);
  });

  it("one bad stored value falls back without losing the others", () => {
    const s = parseSettings({ email: "not-an-email", tagline: "Hello" });
    expect(s.email).toBe(DEFAULT_SETTINGS.email);
    expect(s.tagline).toBe("Hello");
  });
});

describe("settings form", () => {
  it("round-trips the defaults", () => {
    const r = settingsFromForm(form(), DEFAULT_SETTINGS, true);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("reads phone lines and cleans the tel number", () => {
    const r = settingsFromForm(
      form({ phones: "gb | UK | +44 20 1234 5678 | +44 20 1234 5678" }),
      DEFAULT_SETTINGS,
      true,
    );
    expect(r.ok && r.settings.phones[0]).toEqual({
      country: "GB",
      label: "UK",
      display: "+44 20 1234 5678",
      tel: "+442012345678",
    });
  });

  it("reports a bad line with its line number", () => {
    const r = settingsFromForm(form({ phones: "IN | India | x | 123" }), DEFAULT_SETTINGS, true);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.phones).toMatch(/line 1/);
  });

  it("only the owner can change founder publishing", () => {
    const r = settingsFromForm(form({ founderCanPublish: "on" }), DEFAULT_SETTINGS, false);
    expect(r.ok && r.settings.founderCanPublish).toBe(false);
  });

  it("reads legal details and reports a bad privacy email under its own key", () => {
    const ok = settingsFromForm(
      form({ legalCompanyName: "RohTre Media Pvt Ltd", legalJurisdiction: "Lucknow" }),
      DEFAULT_SETTINGS,
      true,
    );
    expect(ok.ok && ok.settings.legal).toMatchObject({
      companyName: "RohTre Media Pvt Ltd",
      jurisdictionCity: "Lucknow",
      privacyEmail: null,
    });
    const bad = settingsFromForm(form({ legalPrivacyEmail: "nope" }), DEFAULT_SETTINGS, true);
    expect(!bad.ok && bad.errors["legal.privacyEmail"]).toBeTruthy();
  });

  it("edits the AI crawler list, de-duplicated, and keeps it when the field is absent", () => {
    const r = settingsFromForm(
      form({ aiBots: ["GPTBot", "ClaudeBot", "GPTBot"].join(String.fromCharCode(10)) }),
      DEFAULT_SETTINGS,
      true,
    );
    expect(r.ok && r.settings.aiBots).toEqual(["GPTBot", "ClaudeBot"]);
    const kept = settingsFromForm(form(), DEFAULT_SETTINGS, true);
    expect(kept.ok && kept.settings.aiBots).toEqual(DEFAULT_SETTINGS.aiBots);
    const bad = settingsFromForm(form({ aiBots: "bad bot!" }), DEFAULT_SETTINGS, true);
    expect(!bad.ok && bad.errors.aiBots).toBeTruthy();
  });
});
