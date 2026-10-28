"use client";

import { useEffect, useState, type ReactNode } from "react";

// Tap (or click) the hero magnet and every piece flies onto its poles and
// sticks, like a real magnet; tap again to let go, or they drop back on their
// own after a few seconds. Only toggles data-attract; the movement is CSS
// (design.css, .rm-mag-snap). Decorative, so it is not a button for screen
// readers; nothing on the page depends on it.

const RELEASE_MS = 4500;

export function MagnetTouch({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setOn(false), RELEASE_MS);
    return () => clearTimeout(t);
  }, [on]);
  return (
    <div className="rm-mag-touch" data-attract={on ? "" : undefined} onClick={() => setOn((v) => !v)}>
      {children}
    </div>
  );
}
