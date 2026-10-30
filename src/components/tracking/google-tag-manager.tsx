"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useSyncExternalStore } from "react";
import { googleConsent, readConsent } from "@/lib/cookie-consent";
import { GTM_ENABLED, GTM_ID, isLandingPath } from "@/lib/data-layer";
import { isMetaPixelExcluded } from "@/lib/meta-pixel";

// Google Tag Manager. Tags live inside the container, not here; GA4 loads from
// there too, so never add it in code. Excluded routes are the Meta Pixel's list.
// Google Consent Mode: tags run with storage denied until the visitor accepts
// (lib/cookie-consent.ts). No <noscript> iframe: it would skip the consent step.

const SNIPPET = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

/** Runs before gtm.js, so the saved choice (or "denied") is set first. */
const consentDefaults = () =>
  `window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('consent','default',${JSON.stringify(
    { ...googleConsent(readConsent()), wait_for_update: 500 },
  )});`;

const onLoad = (notify: () => void) => {
  window.addEventListener("load", notify);
  return () => window.removeEventListener("load", notify);
};
// Same password-field rule as the pixel (the secret sign-in address). The draft
// marker streams in after this renders, so landing pages wait for the full page.
const allowedHere = () => {
  if (isLandingPath(window.location.pathname) && document.readyState !== "complete") return false;
  return !document.querySelector('input[type="password"], [data-draft-preview]');
};

export function GoogleTagManager() {
  const pathname = usePathname();
  const allowed = useSyncExternalStore(onLoad, allowedHere, () => false);

  if (!GTM_ENABLED || !allowed || isMetaPixelExcluded(pathname)) return null;
  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {consentDefaults() + SNIPPET}
    </Script>
  );
}
