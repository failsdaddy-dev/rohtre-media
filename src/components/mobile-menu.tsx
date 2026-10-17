"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";

// Phone menu: a panel under the header. Closes on navigation, Escape, or a
// tap outside; focus returns to the button.
export function MobileMenu({ items, bookHref }: { items: { href: string; label: string }[]; bookHref: string }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  const [lastPath, setLastPath] = useState(path);

  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-full hover:bg-hover"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 top-[var(--header-h)] z-30 bg-[var(--overlay)]"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-menu"
            aria-label="Main"
            className="rm-pop-in fixed inset-x-3 top-[calc(var(--header-h)+8px)] z-40 flex flex-col gap-1 rounded-[20px] border border-line bg-menu p-3 shadow-[0_18px_48px_-14px_rgba(0,0,0,0.4)]"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={path === item.href ? "page" : undefined}
                className="rounded-xl px-4 py-3 text-base font-medium hover:bg-hover aria-[current=page]:text-brand"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={bookHref}
              data-track="book_call_click"
              className="rm-press mt-2 inline-flex h-12 items-center justify-center rounded-full bg-brand font-semibold text-brand-fg"
            >
              Book a Call
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
