"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { readConsent, subscribeConsent } from "@/lib/cookie-consent";
import { pushDataLayer } from "@/lib/data-layer";
import {
  generateEventId,
  isMetaPixelExcluded,
  META_BOOK_CALL_ATTR,
  META_BOOK_CALL_EVENT,
  META_CONVERSION_WHATSAPP,
  META_PIXEL_ENABLED,
  META_PIXEL_ID,
  META_WHATSAPP_HREFS,
  trackMetaConversion,
  trackMetaCustom,
} from "@/lib/meta-pixel";

// The Meta Pixel base code. PageView: the base code sends the first one and
// Meta's script sends the rest itself on history pushState, so there is
// deliberately no route-change tracker here (it would double them).
// autoConfig is off so Meta collects no button clicks of its own.
const BASE_CODE = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`;

// Loads only after the visitor accepts marketing cookies. The secret sign-in
// address can't be listed in browser code, and Meta would receive it, so any
// page with a password field keeps the script off. No <noscript> image: it
// would fire before any choice.
const allowedHere = () => readConsent()?.marketing === true && !document.querySelector('input[type="password"]');

export function MetaPixel() {
  const pathname = usePathname();
  const allowed = useSyncExternalStore(subscribeConsent, allowedHere, () => false);

  if (!META_PIXEL_ENABLED || !allowed || isMetaPixelExcluded(pathname)) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {BASE_CODE}
    </Script>
  );
}

/**
 * The one click listener, for Meta and the GTM data layer: Book a Call by
 * attribute, WhatsApp and phone by href. Never blocks the click.
 */
export function MetaPixelClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isMetaPixelExcluded(window.location.pathname)) return;
      const target = e.target as Element | null;
      if (target?.closest(`[data-meta-event="${META_BOOK_CALL_ATTR}"]`)) {
        trackMetaCustom(META_BOOK_CALL_EVENT);
        pushDataLayer("book_a_call");
      }
      const href = target?.closest("a[href]")?.getAttribute("href") ?? "";
      if (META_WHATSAPP_HREFS.some((h) => href.includes(h))) {
        const eventId = generateEventId();
        trackMetaConversion(META_CONVERSION_WHATSAPP, eventId);
        pushDataLayer("whatsapp_click", { event_id: eventId, link_url: href });
      } else if (href.startsWith("tel:")) {
        pushDataLayer("phone_click", { link_url: href });
      }
    };
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
