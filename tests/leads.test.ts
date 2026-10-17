import { describe, expect, it } from "vitest";
import { readCampaignParams } from "../src/lib/attribution";
import { leadSchema, looksLikeSpam, MIN_FILL_MS } from "../src/lib/lead-schema";

const now = 1_800_000_000_000;
const base = {
  name: "Asha Verma",
  phone: "+91 98765 43210",
  email: "asha@example.com",
  consent: true as const,
  pagePath: "/contact",
  startedAt: now - 20_000,
};

describe("lead validation (R10)", () => {
  it("accepts a normal enquiry and drops empty optional fields", () => {
    const r = leadSchema.safeParse({ ...base, website: "", message: "  " });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.website).toBeUndefined();
      expect(r.data.message).toBeUndefined();
    }
  });

  it("requires consent", () => {
    expect(leadSchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });

  it("rejects a bad phone and a bad email", () => {
    expect(leadSchema.safeParse({ ...base, phone: "call me" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...base, email: "asha@" }).success).toBe(false);
  });

  it("only accepts a same-site page path", () => {
    expect(leadSchema.safeParse({ ...base, pagePath: "https://evil.com" }).success).toBe(false);
  });
});

describe("spam signals", () => {
  it("lets a normal person through", () => {
    expect(looksLikeSpam({ fax: "", startedAt: now - 20_000 }, now)).toBe(false);
  });
  it("catches the honeypot", () => {
    expect(looksLikeSpam({ fax: "123", startedAt: now - 20_000 }, now)).toBe(true);
  });
  it("catches forms sent faster than a person can type", () => {
    expect(looksLikeSpam({ startedAt: now - (MIN_FILL_MS - 1) }, now)).toBe(true);
  });
});

describe("campaign attribution", () => {
  it("keeps UTMs, gclid and fbclid and ignores everything else", () => {
    expect(readCampaignParams("?utm_source=meta&utm_campaign=fashion&gclid=abc&x=1")).toEqual({
      utm_source: "meta",
      utm_campaign: "fashion",
      gclid: "abc",
    });
  });
});
