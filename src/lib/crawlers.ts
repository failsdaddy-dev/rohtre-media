// Crawler rules for page visibility (R42). Defaults live here; the AI list
// itself is edited in admin settings (aiBots) and read by robots.ts and proxy.ts.
//
// verified 2026-10-17:
//   OpenAI      https://developers.openai.com/api/docs/bots
//   Anthropic   https://support.claude.com/en/articles/8896518
//   Perplexity  https://docs.perplexity.ai/guides/bots
//   Google      https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
//               https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers
//   Meta        https://developers.facebook.com/docs/sharing/webmasters/web-crawlers
// unverified: CCBot, Bytespider, Applebot-Extended, Amazonbot (checked in Phase 3)

/** AI crawlers kept away from unlisted pages. */
export const DEFAULT_AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "meta-externalagent",
  "meta-webindexer",
  "meta-externalfetcher",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
] as const;

/**
 * Ad-review crawlers: must always reach landing pages or ads get disapproved.
 * AdsBot ignores `User-agent: *`, so it needs its own group.
 */
export const AD_BOTS = ["AdsBot-Google", "AdsBot-Google-Mobile", "facebookexternalhit", "meta-externalads"] as const;

/** Every landing page lives under this prefix (Gate 0, URL option B). */
export const UNLISTED_PREFIX = "/lp/";

/** Never crawled by anyone. */
export const PRIVATE_PATHS = ["/admin", "/login", "/preview", "/api"];

const has = (ua: string, token: string) => ua.toLowerCase().includes(token.toLowerCase());

/** True when a request's user agent is an AI crawler that unlisted pages refuse. Ad bots always pass. */
export function isBlockedAiBot(userAgent: string | null, aiBots: readonly string[] = DEFAULT_AI_BOTS): boolean {
  if (!userAgent) return false;
  if (AD_BOTS.some((t) => has(userAgent, t))) return false;
  // "Google-Extended" is a robots.txt token only, never sent as a user agent.
  return aiBots.some((t) => t !== "Google-Extended" && has(userAgent, t));
}

export type RobotsRule = { userAgent: string | string[]; allow?: string | string[]; disallow?: string | string[] };

export function robotsRules(aiBots: readonly string[] = DEFAULT_AI_BOTS): RobotsRule[] {
  return [
    // Search engines may fetch unlisted pages so they can read the noindex
    // (a robots.txt block would hide the noindex from them).
    { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    ...(aiBots.length ? [{ userAgent: [...aiBots], disallow: [UNLISTED_PREFIX, ...PRIVATE_PATHS] }] : []),
    { userAgent: [...AD_BOTS], allow: "/", disallow: PRIVATE_PATHS },
  ];
}
