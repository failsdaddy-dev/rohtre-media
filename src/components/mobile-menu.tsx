"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";

// Phone menu: a panel under the header. Closes on navigation, Escape, or a
// tap outside; focus returns to the button.
// Book a Call is not in this menu: the header keeps it visible at every width.
export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
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
        className="rm-nav-link grid size-10 place-items-center rounded-full text-fg hover:bg-hover"
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
          </nav>
        </>
      )}
    </div>
  );
}
