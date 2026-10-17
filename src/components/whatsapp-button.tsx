"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";
import { track } from "@/lib/track";
import { fillTemplate, whatsappLink, type WhatsAppVars } from "@/lib/whatsapp";
import { ChatIcon } from "./icons";

// Floating WhatsApp button on every page (R9). The message names the page the
// visitor is on: a page can describe itself with data-wa-page / data-wa-service
// / data-wa-niche / data-wa-country on any element (landing pages do this in
// Phase 3); otherwise the page title is used.
// It also records the visit's campaign data once per page view (R10) and
// reports clicks on Book a Call and phone links. It is the site's only
// always-loaded script besides the theme toggle.

function pageVars(): WhatsAppVars {
  const el = document.querySelector<HTMLElement>("[data-wa-page]");
  const d = el?.dataset ?? {};
  const title = document.title.split(" | ")[0];
  return { page: d.waPage || title, service: d.waService, niche: d.waNiche, country: d.waCountry };
}

export function WhatsAppButton({ number, template, enabled }: { number: string; template: string; enabled: boolean }) {
  useEffect(() => {
    captureAttribution();
    // Links marked data-track="book_call_click" / "call_click" report a click (R37).
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      const name = el?.dataset.track;
      if (name === "book_call_click" || name === "call_click") track(name);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!enabled) return null;

  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Fill the message at click time, so it always matches the current page.
    e.currentTarget.href = whatsappLink(number, fillTemplate(template, pageVars()));
    track("whatsapp_click");
  };

  return (
    <a
      href={whatsappLink(number, fillTemplate(template, {}))}
      onClick={open}
      target="_blank"
      rel="noopener"
      aria-label="Chat with us on WhatsApp"
      className="rm-press no-lift fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-[#0b3d1f] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] hover:scale-105 max-sm:bottom-4 max-sm:right-4"
    >
      <ChatIcon size={28} strokeWidth={2.2} />
    </a>
  );
}
