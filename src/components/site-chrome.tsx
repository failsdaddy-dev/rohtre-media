import type { ReactNode } from "react";
import { resolveHeaderTone, type HeaderTone } from "@/lib/header-tone";
import { getSettings } from "@/lib/settings";
import { Intro } from "./intro";
import { Motion } from "./motion";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SmoothScroll } from "./smooth-scroll";
import { CookieBanner } from "./tracking/cookie-banner";
import { WhatsAppButton } from "./whatsapp-button";

// The global shell on every public page (R8, R9): header, footer, WhatsApp.
// `tone` sets how the header looks at the top of the page; leaving it out
// gives the safe "solid" header (see lib/header-tone.ts).
export async function SiteChrome({ children, tone }: { children: ReactNode; tone?: HeaderTone }) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-dvh flex-col">
      <Intro />
      <SmoothScroll />
      <SiteHeader tone={resolveHeaderTone(tone)} />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <WhatsAppButton
        number={settings.whatsapp.number}
        template={settings.whatsapp.template}
        enabled={settings.whatsapp.enabled}
        chat={settings.whatsapp}
      />
      <CookieBanner />
      <Motion />
    </div>
  );
}
