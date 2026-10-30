// Meta Pixel: the single source of truth for names and calls. See
// docs/META_PIXEL_EVENTS.md. Only PageView, BookACall and the two Lead
// conversions are tracked; no form text ever goes to Meta. Every call is a
// no-op when fbq is missing (pixel off, excluded page, ad blocker).

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1125813079510077";
export const META_PIXEL_ENABLED = process.env.NEXT_PUBLIC_META_PIXEL_ENABLED === "true";

/**
 * The pixel does not load on these paths. Add a prefix here to exclude more.
 * Landing pages (/lp) keep the pixel: ads point at them.
 */
export const META_PIXEL_EXCLUDED_PATH_PREFIXES = ["/admin", "/api", "/login", "/preview", "/no-access", "/auth"];

export const META_BOOK_CALL_EVENT = "BookACall";
/** Value of the data-meta-event attribute on Book a Call buttons. */
export const META_BOOK_CALL_ATTR = "book_a_call";

/**
 * Standard event for both conversions. Meta's Purchase expects a value and
 * currency, which lead enquiries do not have. If the owner insists on
 * Purchase, only this constant changes.
 */
export const META_CONVERSION_EVENT = "Lead";
export const META_CONVERSION_CATEGORY = "Contact_Conversion";
export const META_CONVERSION_SEND_ENQUIRY = "SendEnquiry";
export const META_CONVERSION_WHATSAPP = "WhatsApp";

/** A link counts as WhatsApp when its href contains one of these. */
export const META_WHATSAPP_HREFS = ["wa.me", "api.whatsapp.com", "whatsapp.com/send"];

type Params = Record<string, string>;
type Options = { eventID?: string };

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function isMetaPixelExcluded(pathname: string): boolean {
  return META_PIXEL_EXCLUDED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function trackMeta(event: string, params: Params = {}, options: Options = {}) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params, options);
}

export function trackMetaCustom(event: string, params: Params = {}) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", event, params);
}

/** The conversion: one Lead, told apart by content_name. */
export function trackMetaConversion(contentName: string, eventId = generateEventId()) {
  trackMeta(
    META_CONVERSION_EVENT,
    { content_name: contentName, content_category: META_CONVERSION_CATEGORY },
    { eventID: eventId },
  );
}
