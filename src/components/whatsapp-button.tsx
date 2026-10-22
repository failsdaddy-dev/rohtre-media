"use client";

import { useEffect, useId, useState } from "react";
import { captureAttribution } from "@/lib/attribution";
import { track } from "@/lib/track";
import type { SiteSettings } from "@/lib/settings-schema";
import { fillTemplate, whatsappLink, type WhatsAppVars } from "@/lib/whatsapp";
import { ChatIcon } from "./icons";

// Floating WhatsApp button on every page (R9). The message names the page the
// visitor is on: a page can describe itself with data-wa-page / data-wa-service
// / data-wa-niche / data-wa-country on any element (landing pages do this in
// Phase 3); otherwise the page title is used.
// It also records the visit's campaign data once per page view (R10) and
// reports clicks on Book a Call and phone links. It is the site's only
// always-loaded script.

function pageVars(): WhatsAppVars {
  const el = document.querySelector<HTMLElement>("[data-wa-page]");
  const d = el?.dataset ?? {};
  const title = document.title.split(" | ")[0];
  return { page: d.waPage || title, service: d.waService, niche: d.waNiche, country: d.waCountry };
}

type Chat = Pick<SiteSettings["whatsapp"], "animation" | "widget" | "agentName" | "status" | "welcome" | "buttonLabel">;

/**
 * The button (64 px, 60 px on phones) with the animation picked in Admin →
 * Settings. With the chat card on, a click opens a small card (like a
 * shop's chat widget): header with the name and a status line, the welcome
 * message, and "Start chat", which opens WhatsApp with the page's message
 * (and is what reports whatsapp_click). Escape or ✕ closes it. With the card
 * off, the button goes straight to WhatsApp as before.
 */
export function WhatsAppButton({
  number,
  template,
  enabled,
  chat,
}: {
  number: string;
  template: string;
  enabled: boolean;
  chat: Chat;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!enabled) return null;

  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Fill the message at click time, so it always matches the current page.
    e.currentTarget.href = whatsappLink(number, fillTemplate(template, pageVars()));
    track("whatsapp_click");
  };
  const href = whatsappLink(number, fillTemplate(template, {}));
  const look =
    "rm-wa fixed bottom-5 right-5 z-40 grid size-16 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] max-sm:bottom-4 max-sm:right-4 max-sm:size-[60px]";
  const icon = (
    <span className="rm-wa-icon grid place-items-center">
      <ChatIcon size={30} strokeWidth={1.6} />
    </span>
  );

  if (!chat.widget) {
    return (
      <a href={href} onClick={go} target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp" data-anim={chat.animation} className={look}>
        {icon}
      </a>
    );
  }

  return (
    <>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={`Chat with ${chat.agentName} on WhatsApp`}
          className="rm-pop-in fixed bottom-[104px] right-5 z-40 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-[20px] bg-white text-[#0a0a0a] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45)] max-sm:bottom-[92px] max-sm:right-4"
        >
          <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3.5 text-white">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
              <ChatIcon size={20} strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold">{chat.agentName}</span>
              {chat.status && <span className="block truncate text-xs text-white/80">{chat.status}</span>}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid size-9 shrink-0 place-items-center rounded-full text-lg hover:bg-white/15"
            >
              ✕
            </button>
          </div>
          <div className="bg-[#efeae2] px-4 py-5">
            <p className="max-w-[85%] whitespace-pre-line rounded-[14px] rounded-tl-none bg-white px-3.5 py-2.5 text-[15px] leading-snug shadow-sm">
              {chat.welcome}
            </p>
          </div>
          <div className="p-3">
            <a
              href={href}
              onClick={go}
              target="_blank"
              rel="noopener"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25d366] text-[15px] font-bold text-white hover:brightness-95"
            >
              <ChatIcon size={18} strokeWidth={2} /> {chat.buttonLabel}
            </a>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close WhatsApp chat" : "Chat with us on WhatsApp"}
        data-anim={chat.animation}
        className={look}
      >
        {icon}
      </button>
    </>
  );
}
