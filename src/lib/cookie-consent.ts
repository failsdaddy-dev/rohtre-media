// The visitor's cookie choice (DPDP: optional cookies stay off until they opt
// in). Saved for a year in the essential cookie_consent cookie named on the
// Cookie Settings page. Browser only.

export type CookieChoice = { analytics: boolean; marketing: boolean; functional: boolean };

export const ACCEPT_ALL: CookieChoice = { analytics: true, marketing: true, functional: true };
export const REJECT_ALL: CookieChoice = { analytics: false, marketing: false, functional: false };

const NAME = "cookie_consent";
const CHANGED = "rm-cookie-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** The raw saved value ("" = no choice yet). A string, so React can compare it between renders. */
export function consentSnapshot(): string {
  const row = document.cookie.split("; ").find((c) => c.startsWith(`${NAME}=`));
  return row ? row.slice(NAME.length + 1) : "";
}

export function readConsent(): CookieChoice | null {
  try {
    const saved = consentSnapshot();
    if (!saved) return null;
    const c = JSON.parse(decodeURIComponent(saved)) as Partial<CookieChoice>;
    return { analytics: c.analytics === true, marketing: c.marketing === true, functional: c.functional === true };
  } catch {
    return null;
  }
}

export function subscribeConsent(notify: () => void) {
  window.addEventListener(CHANGED, notify);
  return () => window.removeEventListener(CHANGED, notify);
}

/** Google Consent Mode values for a choice (no choice = everything denied). */
export function googleConsent(c: CookieChoice | null) {
  const state = (on: boolean | undefined) => (on ? "granted" : "denied");
  return {
    ad_storage: state(c?.marketing),
    ad_user_data: state(c?.marketing),
    ad_personalization: state(c?.marketing),
    analytics_storage: state(c?.analytics),
    functionality_storage: state(c?.functional),
    personalization_storage: state(c?.functional),
    security_storage: "granted",
  };
}

export function saveConsent(choice: CookieChoice) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${NAME}=${encodeURIComponent(JSON.stringify(choice))}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  window.gtag?.("consent", "update", googleConsent(choice));
  window.fbq?.("consent", choice.marketing ? "grant" : "revoke");
  window.dispatchEvent(new Event(CHANGED));
}
