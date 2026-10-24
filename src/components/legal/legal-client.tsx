"use client";

import { useEffect, useRef, useState } from "react";

// The legal pages' small client parts (the rest of the page is server-rendered):
//   LegalProgress  thin red bar under the header showing how far the page is
//                  read (one passive scroll listener, rAF, transform only).
//   LegalToc       "On this page" with scrollspy (IntersectionObserver): the
//                  section in view is highlighted. "panel" = the sticky
//                  desktop card with a sliding indicator bar; "bar" = the
//                  sticky phone/tablet bar showing the current section, with
//                  a fold-out list (items ≥ 44 px). Anchor jumps are smooth
//                  (the site's smooth scroll) and land below the header.

export type TocItem = { id: string; num: string; label: string; color: string };

export function LegalProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const paint = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div aria-hidden="true" className="rm-legal-progress">
      <span ref={bar} />
    </div>
  );
}

/** The id of the section currently in view (the one crossing the upper third of the screen). */
function useActive(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join("|");
  useEffect(() => {
    const list = key.split("|").filter(Boolean);
    const els = list
      .map((id) => document.querySelector<HTMLElement>(`[data-toc-id="${id}"]`))
      .filter((e): e is HTMLElement => Boolean(e));
    if (els.length === 0) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.tocId!;
          if (e.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        const first = list.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return active;
}

export function LegalToc({ items, variant }: { items: TocItem[]; variant: "panel" | "bar" }) {
  const active = useActive(items.map((i) => i.id));
  const list = useRef<HTMLOListElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const current = items.find((i) => i.id === active) ?? items[0];

  // Sliding indicator: follows the active row in the desktop panel.
  useEffect(() => {
    if (variant !== "panel") return;
    const row = list.current?.querySelector<HTMLElement>(`[data-toc-row="${active}"]`);
    if (!row || !mark.current) return;
    mark.current.style.transform = `translateY(${row.offsetTop}px)`;
    mark.current.style.height = `${row.offsetHeight}px`;
    mark.current.style.opacity = "1";
  }, [active, variant]);

  const links = (
    <ol ref={list} className="rm-legal-toc-list">
      {variant === "panel" && <span ref={mark} aria-hidden="true" className="rm-legal-toc-mark" />}
      {items.map((t) => (
        <li key={t.id} data-toc-row={t.id}>
          <a
            href={`#${t.id}`}
            aria-current={t.id === active ? "location" : undefined}
            onClick={() => setOpen(false)}
            className="rm-legal-toc-link"
          >
            <span className="rm-legal-toc-num">{t.num}</span>
            <span aria-hidden="true" className="rm-legal-toc-dot" style={{ background: t.color }} />
            <span className="min-w-0">{t.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === "panel")
    return (
      <nav aria-label="On this page" className="rm-legal-toc-panel">
        <p className="rm-legal-toc-title">On this page</p>
        {links}
      </nav>
    );

  return (
    <nav aria-label="On this page" className="rm-legal-toc-bar">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="rm-legal-toc-toggle">
        <span className="rm-legal-toc-num">{current?.num}</span>
        <span className="min-w-0 flex-1 truncate text-left">{current?.label ?? "On this page"}</span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="rm-legal-toc-drop" data-lenis-prevent="">
          {links}
        </div>
      )}
    </nav>
  );
}
