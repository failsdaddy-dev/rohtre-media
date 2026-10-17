import type { ReactNode } from "react";
import { getSettings } from "@/lib/settings";
import { Intro } from "./intro";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SmoothScroll } from "./smooth-scroll";
import { WhatsAppButton } from "./whatsapp-button";

// The global shell on every public page (R8, R9): header, footer, WhatsApp.
export async function SiteChrome({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-dvh flex-col">
      <Intro />
      <SmoothScroll />
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <WhatsAppButton
        number={settings.whatsapp.number}
        template={settings.whatsapp.template}
        enabled={settings.whatsapp.enabled}
      />
    </div>
  );
}
