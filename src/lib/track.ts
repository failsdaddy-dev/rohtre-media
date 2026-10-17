// Analytics events (R37). Pushes to the GTM data layer; until GTM is added in
// Phase 6 the events simply queue up and nothing is sent anywhere.
export type TrackEvent = "lead_submit" | "whatsapp_click" | "call_click" | "book_call_click";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: TrackEvent, params: Record<string, string | undefined> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, page_path: window.location.pathname, ...params });
}
