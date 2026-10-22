"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { edgeState } from "@/lib/count-up";
import { ArrowRightIcon } from "../icons";

// A sideways row of cards (CSS scroll-snap does the sliding and swiping) with
// previous/next buttons that move one card. A button hides at its end of the
// row; both hide when everything fits. Smooth scrolling only when motion is
// allowed. No library: this is all of it.

export const ROW_ARROW =
  "absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg-elev text-fg shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] transition-colors hover:bg-chip-hover";

export function ScrollRow({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  /** Names the list and its buttons ("Products" → "Previous products"). */
  label: string;
  className?: string;
}) {
  const row = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const update = () => setEdges(edgeState(el.scrollLeft, el.scrollWidth, el.clientWidth));
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, []);

  const step = (direction: number) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector("li");
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const width = card ? card.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * width, behavior: reduce ? "auto" : "smooth" });
  };

  const name = label.toLowerCase();
  return (
    <div className="relative">
      <ul
        ref={row}
        aria-label={label}
        tabIndex={0}
        className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto motion-safe:scroll-smooth ${className}`}
      >
        {children}
      </ul>
      {!edges.atStart && (
        <button
          type="button"
          aria-label={`Previous ${name}`}
          onClick={() => step(-1)}
          className={`${ROW_ARROW} left-1 md:left-0 md:-translate-x-1/2`}
        >
          <ArrowRightIcon size={20} className="rotate-180" />
        </button>
      )}
      {!edges.atEnd && (
        <button
          type="button"
          aria-label={`Next ${name}`}
          onClick={() => step(1)}
          className={`${ROW_ARROW} right-1 md:right-0 md:translate-x-1/2`}
        >
          <ArrowRightIcon size={20} />
        </button>
      )}
    </div>
  );
}
