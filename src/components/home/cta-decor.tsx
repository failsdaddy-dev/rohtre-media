import type { CSSProperties, ReactNode } from "react";
import { CTA_DECOR } from "@/content/layout-presets";
import { CtaParallax } from "./cta-parallax";

// The extra decorative objects of the home CTA card ("Let's talk about your
// brand."), added on top of the card's basic accents (dots, zigzags,
// quarter circles in PanelAccents). Inline SVG in the existing colours only
// (red, white, grey), all aria-hidden and pointer-events: none. Each object
// has a depth layer (how far it drifts with the pointer) and a slow idle
// float. Objects inside the text's safe zone are capped at low opacity and
// sit under the text layer. Used on every page's closing card (Home,
// About, Careers). Admin: Home page → Final call to action and About page →
// Closing call to action → "Show animated objects".

type Depth = keyof typeof CTA_DECOR.travel;
type Obj = {
  name: string;
  depth: Depth;
  /** Position inside the card (CSS left/right/top/bottom). */
  at: CSSProperties;
  size: number;
  /** Inside the safe zone around the heading, text and buttons: opacity capped. */
  safe?: boolean;
  opacity?: number;
  /** Idle float: seconds, x/y px, degrees. */
  float: [number, number, number, number];
  draw: ReactNode;
};

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** The 10 new objects (the 6 basic accents make 16, CTA_DECOR.objects). */
export const CTA_OBJECTS: Obj[] = [
  {
    name: "ring",
    depth: "near",
    at: { left: "5%", top: "16%" },
    size: 44,
    float: [8, 4, -8, 0],
    draw: <circle cx="12" cy="12" r="9" {...line} strokeWidth={2} className="text-brand" />,
  },
  {
    name: "ring small",
    depth: "far",
    at: { right: "4%", top: "44%" },
    size: 26,
    opacity: 0.5,
    float: [10, -3, 6, 0],
    draw: <circle cx="12" cy="12" r="8" {...line} strokeWidth={2} className="text-white" />,
  },
  {
    name: "plus",
    depth: "mid",
    at: { left: "23%", top: "9%" },
    size: 22,
    opacity: 0.55,
    float: [7, 0, -6, 45],
    draw: <path d="M12 4v16M4 12h16" {...line} strokeWidth={2.2} className="text-white" />,
  },
  {
    name: "square",
    depth: "far",
    at: { left: "15%", bottom: "30%" },
    size: 20,
    float: [11, 4, 4, 30],
    draw: <rect x="5" y="5" width="14" height="14" rx="2" {...line} strokeWidth={2} className="text-brand" />,
  },
  {
    name: "cart",
    depth: "near",
    at: { left: "9%", top: "50%" },
    size: 52,
    opacity: 0.6,
    float: [9, 0, -10, -4],
    draw: (
      <g {...line} className="text-white">
        <path d="M3 4h2.2l2.3 10.2a1.5 1.5 0 0 0 1.5 1.2h7.7a1.5 1.5 0 0 0 1.4-1.1L20 8H6.2" />
        <circle cx="9.5" cy="19" r="1.2" />
        <circle cx="16.5" cy="19" r="1.2" />
      </g>
    ),
  },
  {
    name: "parcel",
    depth: "mid",
    at: { right: "9%", top: "26%" },
    size: 48,
    float: [10, 3, -8, 5],
    draw: (
      <g {...line} className="text-brand">
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="M4 7.5l8 4.5 8-4.5M12 12v9M8 5.3l8 4.5" />
      </g>
    ),
  },
  {
    name: "heart bubble",
    depth: "near",
    at: { right: "19%", top: "34%" },
    size: 46,
    opacity: 0.6,
    float: [7, -4, -9, -5],
    draw: (
      <g {...line} className="text-white">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" />
        <path
          d="M12 12.6s-3-1.8-3-3.7a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.9-3 3.7-3 3.7z"
          className="text-brand"
          stroke="currentColor"
        />
      </g>
    ),
  },
  {
    name: "thumbs up",
    depth: "mid",
    at: { left: "21%", bottom: "11%" },
    size: 40,
    opacity: 0.5,
    float: [12, 3, -7, 6],
    draw: (
      <g {...line} className="text-white">
        <path d="M7 10v10H4V10zM7 10l4-7a2 2 0 0 1 2.6 2.4L12.8 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" />
      </g>
    ),
  },
  {
    name: "bell",
    depth: "far",
    at: { right: "31%", bottom: "5%" },
    size: 30,
    safe: true,
    float: [9, -3, -5, 8],
    draw: (
      <g {...line} className="text-brand">
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />
      </g>
    ),
  },
  {
    name: "rupee coin",
    depth: "far",
    at: { left: "31%", top: "5%" },
    size: 34,
    safe: true,
    float: [6, 3, 5, -6],
    draw: (
      <g {...line} className="text-white">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 7.5h6M9 10h6M9 7.5c3 0 4 1 4 2.5s-1 2.5-4 2.5l4 4" />
      </g>
    ),
  },
];

/** The extra objects plus the pointer-drift script (closing CTA cards). */
export function CtaDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden sm:block">
      {CTA_OBJECTS.map((o) => (
        <span
          key={o.name}
          className="rm-px absolute"
          data-depth={o.depth}
          style={
            {
              ...o.at,
              width: o.size,
              height: o.size,
              opacity: o.safe ? Math.min(o.opacity ?? 1, CTA_DECOR.safeOpacity) : (o.opacity ?? 1),
              "--travel": CTA_DECOR.travel[o.depth],
            } as CSSProperties
          }
        >
          <svg
            viewBox="0 0 24 24"
            className="rm-idle block size-full"
            style={
              {
                "--fd": `${o.float[0]}s`,
                "--ix": `${o.float[1]}px`,
                "--iy": `${o.float[2]}px`,
                "--ir": `${o.float[3]}deg`,
              } as CSSProperties
            }
          >
            {o.draw}
          </svg>
        </span>
      ))}
      <CtaParallax />
    </div>
  );
}
