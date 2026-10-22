import type { CSSProperties, ReactNode } from "react";

// The hero's default visual (when hero.visual = "illustration"): a red
// horseshoe magnet with metal poles pulling in floating e-commerce pieces
// (cart, parcel, a "New Order" card, like and heart bubbles, and the
// official Shopify and Meta logos, unmodified, as "platforms we work with").
// Drawn inline (no photos, no people), coloured from the theme tokens, so it
// costs no request apart from the two small logo files. Each piece floats on
// its own slow loop (transform only, .rm-float in design.css); still for
// people who prefer reduced motion. Decorative: hidden from screen readers.

const float = (duration: number, delay: number, dx = -6, dy = -12, rotate = 2) =>
  ({
    "--fd": `${duration}s`,
    "--fdl": `${delay}s`,
    "--fx": `${dx}px`,
    "--fy": `${dy}px`,
    "--fr": `${rotate}deg`,
  }) as CSSProperties;

function Piece({ style, children }: { style: CSSProperties; children: ReactNode }) {
  return (
    <g className="rm-float" style={style}>
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
          {stop(0, "var(--grad-c)")}
          {stop(0.45, "var(--grad-b)")}
          {stop(1, "var(--grad-a)")}
        </linearGradient>
        <linearGradient id="rm-mag-metal" x1="0" y1="0" x2="0" y2="1">
          {stop(0, "var(--fg)")}
          {stop(0.45, "var(--fg)", 0.92)}
          {stop(0.62, "var(--fg-2)")}
          {stop(1, "var(--fg-2)", 0.85)}
        </linearGradient>
        <radialGradient id="rm-mag-glow" cx="0.5" cy="0.5" r="0.5">
          {stop(0, "var(--brand)", 0.32)}
          {stop(1, "var(--brand)", 0)}
        </radialGradient>
      </defs>

      <circle cx="330" cy="290" r="270" fill="url(#rm-mag-glow)" />

      {/* Field lines: the pull from the poles towards the pieces. */}
      <g fill="none" stroke="var(--grad-c)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 12" opacity="0.45">
        <path d="M392 150c60-30 120-40 170-20" />
        <path d="M398 205c70 0 120 40 160 100" />
        <path d="M388 420c50 10 90 20 120 0" />
      </g>

      {/* The magnet, tilted so the poles point up and to the right. */}
      <g transform="rotate(-16 250 300)">
        <g transform="translate(12 14)">
          <path d={BODY} fill="var(--grad-a)" />
          <path d={BODY} fill="#000" opacity="0.5" />
          <rect x="300" y="125" width="72" height="90" rx="6" fill="var(--fg-2)" />
          <rect x="300" y="385" width="72" height="90" rx="6" fill="var(--fg-2)" />
        </g>
        <path d={BODY} fill="url(#rm-mag-red)" />
        <path
          d="M250 142a158 158 0 0 0-148 112"
          fill="none"
          stroke="var(--fg)"
          strokeOpacity="0.4"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path d="M250 215a85 85 0 0 0 0 170" fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="12" />
        {[125, 385].map((y) => (
          <g key={y}>
            <rect x="300" y={y} width="72" height="90" rx="6" fill="url(#rm-mag-metal)" />
            <rect x="300" y={y} width="7" height="90" fill="#000" opacity="0.25" />
            <rect x="308" y={y + 8} width="58" height="12" rx="4" fill="var(--fg)" opacity="0.75" />
          </g>
        ))}
      </g>

      {/* Shopify (official bag, unmodified) */}
      <Piece style={float(8, -1.5, -5, -14, 4)}>
        <circle cx="436" cy="74" r="56" fill="var(--fg)" opacity="0.06" />
        <image href="/brand/platforms/shopify-bag.svg" x="404" y="36" width="66" height="76" />
      </Piece>

      {/* Heart bubble */}
      <Piece style={float(7, -3.2, 4, -10, -3)}>
        <path
          d="M548 44h44a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14h-20l-14 14v-14h-10a14 14 0 0 1-14-14V58a14 14 0 0 1 14-14Z"
          fill="var(--grad-b)"
        />
        <path d="M570 96s-17-10-17-22a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22Z" fill="var(--fg)" />
      </Piece>

      {/* Meta (official lockup, unmodified) on a quiet pill */}
      <Piece style={float(9, -5, -4, -9, -2)}>
        <rect
          x="470"
          y="150"
          width="136"
          height="54"
          rx="27"
          fill="var(--fg)"
          fillOpacity="0.07"
          stroke="var(--fg)"
          strokeOpacity="0.2"
        />
        <image href="/brand/platforms/meta-lockup-white.svg" x="491" y="159" width="94" height="36" />
      </Piece>

      {/* Cart chip, nearest the top pole */}
      <Piece style={float(6.5, -2.4, -8, -8, 6)}>
        <rect x="392" y="236" width="68" height="68" rx="18" fill="var(--fg)" />
        <path
          d={CART}
          transform="translate(404 248) scale(1.8)"
          fill="none"
          stroke="var(--grad-a)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Piece>

      {/* "New Order" notification */}
      <Piece style={float(8.5, -0.8, -6, -11, -1.5)}>
        <rect x="436" y="300" width="186" height="74" rx="16" fill="var(--fg)" />
        <rect x="450" y="317" width="40" height="40" rx="11" fill="var(--grad-b)" />
        <path
          d={CART}
          transform="translate(458 325) scale(1)"
          fill="none"
          stroke="var(--fg)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="502" y="334" fontSize="17" fontWeight="700" fill="var(--chip-on-fg)">
          New Order
        </text>
        <rect x="502" y="344" width="96" height="6" rx="3" fill="var(--fg-2)" opacity="0.55" />
        <rect x="502" y="356" width="62" height="6" rx="3" fill="var(--fg-2)" opacity="0.35" />
      </Piece>

      {/* Parcel */}
      <Piece style={float(10, -6, 5, -10, -4)}>
        <g transform="translate(36 8)">
          <path d="M420 432l46-22 46 22-46 22Z" fill="var(--tint-orange)" />
          <path d="M420 432l46-22 46 22-46 22Z" fill="var(--fg)" opacity="0.28" />
          <path d="M420 432v56l46 24v-58Z" fill="var(--tint-orange)" />
          <path d="M466 454v58l46-24v-56Z" fill="var(--tint-orange)" />
          <path d="M466 454v58l46-24v-56Z" fill="#000" opacity="0.25" />
          <path d="M443 421l46 22v22" fill="none" stroke="var(--fg)" strokeOpacity="0.55" strokeWidth="6" />
        </g>
      </Piece>

      {/* Thumbs-up bubble */}
      <Piece style={float(7.5, -4.4, -5, -12, 3)}>
        <g transform="translate(24 52)">
          <path
            d="M548 402h44a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14h-10v14l-14-14h-20a14 14 0 0 1-14-14v-34a14 14 0 0 1 14-14Z"
            fill="var(--tint-blue)"
          />
          <path
            d="M556 430h8v24h-8Zm12 24v-22l8-14c4 0 6 3 5 7l-2 7h11a4 4 0 0 1 4 5l-4 13a4 4 0 0 1-4 4Z"
            fill="var(--fg)"
          />
        </g>
      </Piece>
    </svg>
  );
}
