import { describe, expect, it } from "vitest";
import { AD_BOTS, isBlockedAiBot, robotsRules, UNLISTED_PREFIX } from "../src/lib/crawlers";

const UA = {
  gptbot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  claudebot: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  perplexity: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  adsbot: "AdsBot-Google (+http://www.google.com/adsbot.html)",
  adsbotMobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1 (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)",
  facebook: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
};

describe("AI crawler blocking on unlisted pages (R42)", () => {
  it("blocks named AI crawlers", () => {
    expect(isBlockedAiBot(UA.gptbot)).toBe(true);
    expect(isBlockedAiBot(UA.claudebot)).toBe(true);
    expect(isBlockedAiBot(UA.perplexity)).toBe(true);
  });

  it("never blocks ad-review bots, search engines or people", () => {
    expect(isBlockedAiBot(UA.adsbot)).toBe(false);
    expect(isBlockedAiBot(UA.adsbotMobile)).toBe(false);
    expect(isBlockedAiBot(UA.facebook)).toBe(false);
    expect(isBlockedAiBot(UA.googlebot)).toBe(false);
    expect(isBlockedAiBot(UA.chrome)).toBe(false);
    expect(isBlockedAiBot(null)).toBe(false);
  });
});

describe("robots.txt rules", () => {
  const rules = robotsRules();

  it("AI crawlers are kept out of the unlisted prefix", () => {
    const ai = rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes("GPTBot"));
    expect(ai?.disallow).toContain(UNLISTED_PREFIX);
  });

  it("ad bots get their own group that allows landing pages (they ignore *)", () => {
    const ads = rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes("AdsBot-Google"));
    expect(ads?.allow).toBe("/");
    expect(ads?.disallow).not.toContain(UNLISTED_PREFIX);
    for (const bot of AD_BOTS) expect(ads?.userAgent).toContain(bot);
  });

  it("search engines may fetch unlisted pages so they can read noindex", () => {
    const all = rules.find((r) => r.userAgent === "*");
    expect(all?.disallow).not.toContain(UNLISTED_PREFIX);
    expect(all?.disallow).toContain("/admin");
  });
});
