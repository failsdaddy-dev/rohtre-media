import type { CSSProperties, ReactNode } from "react";

// The hero's default visual (when hero.visual = "illustration"): a red
// horseshoe magnet with silver poles pulling in e-commerce pieces (Shopify
// bag, Meta, heart, cart, a "New Order" card, parcel, thumbs-up), drawn
// inline for the light sky-blue hero. Pieces are frosted white glass tiles
// with navy glyphs (red only as a small accent); the official Shopify and
// Meta files are used unmodified. Motion (CSS in design.css, transform and
// opacity only): the magnet floats 8 px on a 10 s loop; each piece drifts
// along a curved path towards the magnet and back, and the "New Order" card
// pops slightly when it is closest. Still for reduced motion. Below 768 px
// the parcel and thumbs-up are hidden (5 pieces, bottom-right kept clear for
// the WhatsApp button). Decorative: hidden from screen readers.

const NAVY = "#12305A";
const GLASS = { fill: "rgba(255,255,255,0.7)", stroke: "#ffffff", strokeWidth: 1 } as const;

/** A piece's pull towards the magnet: offset (px in the drawing) and delay (s). */
const pull = (px: number, py: number, delay: number, rotate = 3) =>
  ({ "--px": `${px}px`, "--py": `${py}px`, "--pr": `${rotate}deg`, "--dl": `${delay}s` }) as CSSProperties;

function Piece({ style, extra, children }: { style: CSSProperties; extra?: boolean; children: ReactNode }) {
  return (
    <g className={`rm-mag-piece ${extra ? "rm-mag-extra" : ""}`} style={style} filter="url(#rm-mag-glass)">
      {children}
    </g>
  );
}

const stop = (offset: number, color: string, opacity = 1) => (
  <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
);

/** The magnet's body: a U opening to the right, legs ending where the poles start. */
const BODY = "M300 125H250a175 175 0 0 0 0 350h50v-90h-50a85 85 0 0 1 0-170h50Z";
/** The 24-px cart icon (same drawing as ServiceIcon "cart"). */
const CART = "M3 4h2l2.4 11h10.2L20 7H6.2M9 19.5h.01M17 19.5h.01";

export function HeroMagnet({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 560" className={`rm-magnet h-auto w-full ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rm-mag-red" x1="0" y1="0" x2="0.35" y2="1">
          {stop(0, "#ff4d5a")}
          {stop(0.45, "var(--brand)")}
          {stop(1, "#a3000b")}
        </linearGradient>
        <linearGradient id="rm-mag-metal" x1="0" y1="0" x2="0" y2="1">
          {stop(0, "#ffffff")}
          {stop(0.35, "#e4e9ef")}
          {stop(0.62, "#b8c2cd")}
          {stop(1, "#eef2f6")}
        </linearGradient>
        <radialGradient id="rm-mag-glow" cx="0.5" cy="0.5" r="0.5">
          {stop(0, "var(--brand)", 0.18)}
          {stop(1, "var(--brand)", 0)}
        </radialGradient>
        <radialGradient id="rm-mag-shadow" cx="0.5" cy="0.5" r="0.5">
          {stop(0, "#2a5a90", 0.28)}
          {stop(1, "#2a5a90", 0)}
        </radialGradient>
        <filter id="rm-mag-glass" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="rgb(40,90,160)" floodOpacity="0.18" />
        </filter>
      </defs>

      <circle cx="300" cy="290" r="260" fill="url(#rm-mag-glow)" />
      {/* Blue-tinted ground shadow */}
      <ellipse cx="250" cy="525" rx="190" ry="24" fill="url(#rm-mag-shadow)" />

      {/* Orbit paths */}
      <g
        fill="none"
        stroke="#7FB2E5"
        strokeOpacity="0.6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 12"
      >
        <path d="M392 150c60-30 120-40 170-20" />
        <path d="M398 205c70 0 120 40 160 100" />
        <path d="M388 420c50 10 90 20 120 0" />
      </g>

      {/* The magnet, tilted so the poles point up and to the right; floats gently. */}
      <g className="rm-mag-body">
        <g transform="rotate(-16 250 300)">
          <g transform="translate(10 12)">
            <path d={BODY} fill="#8a0008" />
            <rect x="300" y="125" width="72" height="90" rx="6" fill="#9aa6b4" />
            <rect x="300" y="385" width="72" height="90" rx="6" fill="#9aa6b4" />
          </g>
          <path d={BODY} fill="url(#rm-mag-red)" />
          <path
            d="M250 142a158 158 0 0 0-148 112"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.45"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path d="M250 215a85 85 0 0 0 0 170" fill="none" stroke="#5a0006" strokeOpacity="0.3" strokeWidth="12" />
          {[125, 385].map((y) => (
            <g key={y}>
              <rect x="300" y={y} width="72" height="90" rx="6" fill="url(#rm-mag-metal)" />
              <rect x="300" y={y} width="5" height="90" fill="#9aa6b4" opacity="0.6" />
              <rect x="308" y={y + 8} width="58" height="10" rx="4" fill="#ffffff" opacity="0.9" />
            </g>
          ))}
        </g>
      </g>

      {/* Shopify (official bag, unmodified) on a glass disc */}
      <Piece style={pull(-26, 22, 0)}>
        <circle cx="436" cy="74" r="56" {...GLASS} />
        <image href="/brand/platforms/shopify-bag.svg" x="406" y="40" width="60" height="68" />
      </Piece>

      {/* Heart bubble: glass, red heart as the accent */}
      <Piece style={pull(-34, 30, -1.6, -4)}>
        <path
          d="M548 44h44a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14h-20l-14 14v-14h-10a14 14 0 0 1-14-14V58a14 14 0 0 1 14-14Z"
          {...GLASS}
        />
        <path d="M570 96s-17-10-17-22a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22Z" fill="var(--brand)" />
      </Piece>

      {/* Meta (official white lockup, unmodified) on a navy pill so it stays legible */}
      <Piece style={pull(-30, 12, -3.4, -2)}>
        <rect x="470" y="150" width="136" height="54" rx="27" fill={NAVY} stroke="#ffffff" strokeWidth="1" />
        <image href="/brand/platforms/meta-lockup-white.svg" x="491" y="159" width="94" height="36" />
      </Piece>

      {/* Cart tile, nearest the top pole */}
      <Piece style={pull(-22, -8, -5, 5)}>
        <rect x="392" y="236" width="68" height="68" rx="18" {...GLASS} />
        <path
          d={CART}
          transform="translate(404 248) scale(1.8)"
          fill="none"
          stroke={NAVY}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Piece>

      {/* "New Order" card: pops when it is closest to the magnet */}
      <Piece style={pull(-40, -6, -2.5, -1.5)}>
        <g className="rm-mag-pop">
          <rect x="436" y="300" width="186" height="74" rx="16" {...GLASS} />
          <rect x="450" y="317" width="40" height="40" rx="11" fill="var(--brand)" />
          <path
            d={CART}
            transform="translate(458 325) scale(1)"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="502" y="334" fontSize="17" fontWeight="700" fill={NAVY}>
            New Order
          </text>
          <rect x="502" y="344" width="96" height="6" rx="3" fill={NAVY} opacity="0.35" />
          <rect x="502" y="356" width="62" height="6" rx="3" fill={NAVY} opacity="0.2" />
        </g>
      </Piece>

      {/* Parcel: light glass faces, navy tape */}
      <Piece extra style={pull(-36, -26, -6.5, -4)}>
        <g transform="translate(36 8)">
          <path d="M420 432l46-22 46 22-46 22Z" fill="rgba(255,255,255,0.85)" stroke="#ffffff" />
          <path d="M420 432v56l46 24v-58Z" fill="#dbe7f5" stroke="#ffffff" />
          <path d="M466 454v58l46-24v-56Z" fill="#bfd3ea" stroke="#ffffff" />
          <path d="M443 421l46 22v22" fill="none" stroke={NAVY} strokeOpacity="0.7" strokeWidth="6" />
        </g>
      </Piece>

      {/* Thumbs-up bubble */}
      <Piece extra style={pull(-30, -34, -8, 3)}>
        <g transform="translate(24 52)">
          <path
            d="M548 402h44a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14h-10v14l-14-14h-20a14 14 0 0 1-14-14v-34a14 14 0 0 1 14-14Z"
            {...GLASS}
          />
          <path
            d="M556 430h8v24h-8Zm12 24v-22l8-14c4 0 6 3 5 7l-2 7h11a4 4 0 0 1 4 5l-4 13a4 4 0 0 1-4 4Z"
            fill={NAVY}
          />
        </g>
      </Piece>
    </svg>
  );
}
