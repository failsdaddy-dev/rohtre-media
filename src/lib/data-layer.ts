import { generateEventId } from "./meta-pixel";

// Google Tag Manager data layer events, see docs/GTM_DATALAYER.md. No page_view
// here (GTM handles it) and no form text, ever. A no-op when dataLayer is missing.

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";
export const GTM_ENABLED = process.env.NEXT_PUBLIC_GTM_ENABLED === "true" && /^GTM-[A-Z0-9]+$/.test(GTM_ID);

export type DataLayerEvent = "book_a_call" | "whatsapp_click" | "phone_click" | "send_enquiry_success";

export const isLandingPath = (pathname: string) => pathname === "/lp" || pathname.startsWith("/lp/");

export function pushDataLayer(event: DataLayerEvent, params: { event_id?: string; link_url?: string } = {}) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  const page_path = window.location.pathname;
  window.dataLayer.push({
    event,
    page_path,
    page_type: isLandingPath(page_path) ? "landing" : "site",
    ...params,
    event_id: params.event_id ?? generateEventId(),
  });
}
