"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ADMIN_TABS } from "./ui";

// Quick find: press Ctrl+K (⌘K on a Mac) or the search button, type a few
// letters ("logo", "whatsapp", "faq", "leads"…) and press Enter. It searches
// every admin page by its name, menu and plain-words description, so nobody
// has to know which menu a page sits in. Only pages this account may open.
// The panel is drawn on <body> (a portal): inside the blurred header it would
// be trapped in the header's box, so the backdrop could not cover the page.
// Closes on Esc, a click/tap outside, or picking a page.

const GROUP_NAME = { primary: "Main", company: "Company pages", legal: "Legal", more: "More", account: "Account" };

/** Extra words people type for a page. */
const ALIASES: Record<string, string> = {
  "/admin/proof": "results testimonials reviews logo badges creatives reels partners",
  "/admin/settings": "whatsapp phone email address form budget interested publish owner",
  "/admin/pages": "lp ads meta google niche country publish delete campaign",
  "/admin/media": "images videos photos upload cloudinary",
  "/admin/home": "hero magnet video faq founder showcase",
  "/admin/routing": "redirect 301 utm",
  "/admin/guide": "help how tutorial start",
};

export function AdminSearch({ canManage, isOwner }: { canManage: boolean; isOwner: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const tabs = ADMIN_TABS.filter((t) => (!t.manage || canManage) && (!t.owner || isOwner));
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const ORDER = Object.keys(GROUP_NAME);
  // Grouped (Main, Company pages, Legal, More, Account), menu order inside each group.
  const results = tabs
    .filter((t) => {
      const hay = `${t.label} ${t.hint} ${GROUP_NAME[t.group]} ${ALIASES[t.href] ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group));

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  // While open: focus the box, Esc closes from anywhere, the page behind doesn't scroll.
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQ("");
        setActive(0);
      }
    };
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setQ("");
    setActive(0);
  };
  const go = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-bg-elev px-3 text-sm text-fg-2 hover:text-fg"
        aria-label="Quick find (Ctrl+K)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden xl:inline">Find…</span>
        <kbd className="hidden rounded-md border border-line px-1.5 text-[11px] font-semibold xl:inline">Ctrl K</kbd>
      </button>

      {open &&
        createPortal(
          <div
            className="rm-admin-fade fixed inset-0 z-[70] flex items-start justify-center bg-[rgb(10_10_10/0.45)] px-4 pt-[12vh] backdrop-blur-[3px]"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Quick find"
              className="rm-admin-pop w-full max-w-xl overflow-hidden border border-line bg-bg-elev shadow-[0_40px_100px_-30px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-center gap-3 border-b border-line px-5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                  className="shrink-0 text-brand"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") close();
                    else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive((a) => Math.min(a + 1, results.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive((a) => Math.max(a - 1, 0));
                    } else if (e.key === "Enter" && results[active]) go(results[active].href);
                  }}
                  placeholder="What do you want to edit? Try “logo”, “WhatsApp”, “FAQ”"
                  aria-label="Search the admin"
                  className="h-16 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-fg-2"
                />
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-fg-2 hover:text-fg"
                  aria-label="Close"
                >
                  Esc
                </button>
              </div>
              <ul className="max-h-[52vh] overflow-y-auto py-2" role="listbox" aria-label="Admin pages">
                {results.length === 0 && (
                  <li className="px-5 py-10 text-center text-sm text-fg-2">Nothing found. Try another word.</li>
                )}
                {results.map((t, i) => (
                  <Fragment key={t.href}>
                    {(i === 0 || results[i - 1].group !== t.group) && (
                      <li
                        aria-hidden="true"
                        className="px-5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-2"
                      >
                        {GROUP_NAME[t.group]}
                      </li>
                    )}
                    <li role="option" aria-selected={i === active}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(t.href)}
                        className={`flex w-full items-center gap-3 border-l-[3px] px-5 py-2.5 text-left transition-colors ${
                          i === active
                            ? "border-brand bg-[color-mix(in_srgb,var(--brand)_7%,transparent)]"
                            : "border-transparent"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[15px] font-semibold ${i === active ? "text-brand" : ""}`}>
                            {t.label}
                          </span>
                          <span className="block truncate text-xs text-fg-2">{t.hint}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`text-sm ${i === active ? "text-brand" : "text-transparent"}`}
                        >
                          ↵
                        </span>
                      </button>
                    </li>
                  </Fragment>
                ))}
              </ul>
              <div className="flex items-center gap-4 border-t border-line bg-bg px-5 py-2.5 text-[11px] text-fg-2 max-sm:hidden">
                <span>
                  <kbd className="rounded border border-line px-1">↑</kbd>{" "}
                  <kbd className="rounded border border-line px-1">↓</kbd> move
                </span>
                <span>
                  <kbd className="rounded border border-line px-1">Enter</kbd> open
                </span>
                <span>
                  <kbd className="rounded border border-line px-1">Esc</kbd> close
                </span>
                <span className="ml-auto">
                  {results.length} {results.length === 1 ? "page" : "pages"}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
