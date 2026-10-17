// First-touch campaign data (UTMs, gclid, fbclid, referrer) kept for this
// browser tab, so a visitor who lands from an ad and then opens /contact still
// carries the ad's parameters into the lead (R10).
export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;
export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number] | "referrer" | "landing_path", string>>;

const STORE = "rm-attrib";

/** Pure: pick campaign params from a query string. */
export function readCampaignParams(search: string): Attribution {
  const q = new URLSearchParams(search);
  const out: Attribution = {};
  for (const k of ATTRIBUTION_KEYS) {
    const v = q.get(k);
    if (v) out[k] = v.slice(0, 300);
  }
  return out;
}

/**
 * Called once per page view. The first page of the visit is saved; a later
 * page that arrives with campaign data (a new ad click) replaces it.
 */
export function captureAttribution() {
  try {
    const current = readCampaignParams(window.location.search);
    const hasCampaign = Object.keys(current).length > 0;
    if (sessionStorage.getItem(STORE) && !hasCampaign) return;
    const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";
    sessionStorage.setItem(
      STORE,
      JSON.stringify({ ...current, referrer: ref.slice(0, 500), landing_path: window.location.pathname }),
    );
  } catch {
    /* storage blocked: the form falls back to the current URL */
  }
}

export function loadAttribution(): Attribution {
  try {
    const saved = sessionStorage.getItem(STORE);
    if (saved) return JSON.parse(saved) as Attribution;
  } catch {
    /* ignore */
  }
  return { ...readCampaignParams(window.location.search), referrer: document.referrer.slice(0, 500) };
}
