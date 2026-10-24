"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { lerp, parallaxAllowed, pointerOffset, settled } from "@/lib/parallax";

// The Contact page's background scene: frosted-glass tiles (shopping bag,
// browser window, phone, automation flow, rupee growth chart, megaphone and
// two plain "Google Ads" / "Meta Ads" text pills; no official logos) in the
// sky-blue theme, navy glyphs with red only as a small accent. Behind the
// text and the form (z-index), pointer-events: none, aria-hidden.
// Motion (design.css, .rm-ct-*): each tile has a depth; as the pointer moves
// the tiles shift the opposite way (up to 24 px near, 8 px far), eased with
// lerp in one requestAnimationFrame loop that runs only while easing, and
// stops when the tab is hidden or the scene is off screen. Plus a slow idle
// float (CSS, transform only). Touch screens: idle float only. Phones: 5
// tiles in a row above the heading, away from every field. Reduced motion:
// still. Same helpers as the Home closing card (src/lib/parallax.ts).

const NAVY = "#12305A";
const RED = "var(--brand)";
const TRAVEL = { near: 24, mid: 14, far: 8 } as const;

type Tile = {
  name: string;
  depth: keyof typeof TRAVEL;
  /** Desktop place in the section (percent). */
  at: { left: string; top: string };
  /** Phones: left (percent) in the row above the heading; absent = hidden on phones. */
  m?: string;
  size?: number;
  /** Idle float: seconds, x px, y px. */
  float: [number, number, number];
  pill?: string;
  draw?: ReactNode;
};

const stroke = {
  fill: "none",
  stroke: NAVY,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const TILES: Tile[] = [
  {
    name: "browser",
    depth: "near",
    at: { left: "80%", top: "6%" },
    size: 92,
    float: [9, 0, -8],
    draw: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" {...stroke} />
        <path d="M3 9h18M7 13h6M7 16h9" {...stroke} />
        <circle cx="5.6" cy="7" r=".7" fill={RED} />
      </>
    ),
  },
  {
    name: "bag",
    depth: "mid",
    at: { left: "62%", top: "8%" },
    m: "4%",
    size: 68,
    float: [7, 3, -7],
    draw: (
      <>
        <path d="M5.5 8.5h13l-1 11.5h-11l-1-11.5Z" {...stroke} />
        <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" {...stroke} />
        <circle cx="12" cy="13.5" r="1.3" fill={RED} />
      </>
    ),
  },
  {
    name: "google ads",
    depth: "far",
    at: { left: "84%", top: "17%" },
    m: "40%",
    float: [10, -4, 6],
    pill: "Google Ads",
  },
  {
    name: "megaphone",
    depth: "mid",
    at: { left: "1.5%", top: "42%" },
    m: "86%",
    size: 64,
    float: [8, 4, 6],
    draw: (
      <>
        <path d="M4 10v4h3l8 4.5v-13L7 10H4Z" {...stroke} />
        <path d="M7 14l1 4.5" {...stroke} />
        <path d="M18 9.5a3.5 3.5 0 0 1 0 5" {...stroke} stroke={RED} />
      </>
    ),
  },
  {
    name: "phone",
    depth: "near",
    at: { left: "93%", top: "40%" },
    m: "22%",
    size: 72,
    float: [6, -3, 8],
    draw: (
      <>
        <rect x="7" y="3" width="10" height="18" rx="2.2" {...stroke} />
        <path d="M10.5 18h3" {...stroke} />
        <rect x="9.5" y="6.5" width="5" height="3.5" rx=".8" fill={RED} />
        <path d="M9.5 12.5h5M9.5 14.5h3" {...stroke} />
      </>
    ),
  },
  {
    name: "automation",
    depth: "far",
    at: { left: "3%", top: "68%" },
    size: 60,
    float: [10, 3, -6],
    draw: (
      <>
        <circle cx="6" cy="6" r="2.4" {...stroke} />
        <circle cx="6" cy="18" r="2.4" {...stroke} />
        <circle cx="18" cy="12" r="2.6" fill={RED} />
        <path d="M8.2 7.2 15.6 11M8.2 16.8l7.4-3.8" {...stroke} />
      </>
    ),
  },
  {
    name: "growth chart",
    depth: "mid",
    at: { left: "92%", top: "76%" },
    m: "70%",
    size: 70,
    float: [9, -3, -7],
    draw: (
      <>
        <path d="M4 20h16" {...stroke} />
        <path d="M5 16l4.5-4.5 3.5 3 6-6.5" {...stroke} stroke={RED} />
        <path d="M15.5 8h3.5v3.5" {...stroke} stroke={RED} />
        <text x="4" y="8.5" fontSize="6.5" fontWeight="700" fill={NAVY} fontFamily="Arial, sans-serif">
          ₹
        </text>
      </>
    ),
  },
  {
    name: "meta ads",
    depth: "far",
    at: { left: "66%", top: "17%" },
    float: [8, 4, 5],
    pill: "Meta Ads",
  },
];

export function ContactScene() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = root.current;
    const host = scene?.parentElement;
    if (!scene || !host) return;

    let frame = 0;
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    let visible = true;
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scene.toggleAttribute("data-offscreen", !visible);
      if (!visible) stop();
    });
    seen.observe(host);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!parallaxAllowed(reduce, coarse)) return () => seen.disconnect();

    let rect: DOMRect | null = null;
    let target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    const tick = () => {
      now.x = lerp(now.x, target.x, 0.08);
      now.y = lerp(now.y, target.y, 0.08);
      scene.style.setProperty("--px", now.x.toFixed(4));
      scene.style.setProperty("--py", now.y.toFixed(4));
      frame = settled(now.x, target.x) && settled(now.y, target.y) ? 0 : requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !visible || document.hidden) return;
      rect ??= host.getBoundingClientRect();
      target = pointerOffset(e.clientX, e.clientY, rect);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const stale = () => {
      rect = null;
    };
    const hidden = () => document.hidden && stop();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", stale, { passive: true });
    window.addEventListener("resize", stale, { passive: true });
    document.addEventListener("visibilitychange", hidden);
    return () => {
      stop();
      seen.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", stale);
      window.removeEventListener("resize", stale);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);

  return (
    <div ref={root} aria-hidden="true" className="rm-ct-scene">
      {TILES.map((t) => (
        <span
          key={t.name}
          className="rm-ct-obj"
          data-m={t.m ? "" : undefined}
          style={
            {
              "--l": t.at.left,
              "--t": t.at.top,
              "--ml": t.m,
              "--travel": TRAVEL[t.depth],
              "--fd": `${t.float[0]}s`,
              "--fx": `${t.float[1]}px`,
              "--fy": `${t.float[2]}px`,
              "--sz": `${t.size ?? 64}px`,
            } as CSSProperties
          }
        >
          {t.pill ? (
            <span className="rm-ct-tile rm-ct-pill">
              <span className="rm-ct-dot" />
              {t.pill}
            </span>
          ) : (
            <span className="rm-ct-tile">
              <svg viewBox="0 0 24 24" focusable="false">
                {t.draw}
              </svg>
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
