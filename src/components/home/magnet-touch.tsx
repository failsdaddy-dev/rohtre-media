"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The hero magnet pulls on its own: every piece flies onto the poles and
// sticks, lets go, and repeats while the hero is on screen. Tap (or click) to
// attract or release at any time; a tap holds a little longer, then the loop
// carries on. Only toggles data-attract; the movement is CSS (design.css,
// .rm-mag-snap). With reduced motion it only moves on a tap. Decorative, so it
// is not a button for screen readers; nothing on the page depends on it.

const HOLD_MS = 2500;
const REST_MS = 2500;
const TAP_HOLD_MS = 4500;

export function MagnetTouch({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const tapped = useRef(false);
  const [on, setOn] = useState(false);
  const [inView, setInView] = useState(false);
  const [taps, setTaps] = useState(0);

  useEffect(() => {
    const seen = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (box.current) seen.observe(box.current);
    return () => seen.disconnect();
  }, []);

  useEffect(() => {
    if (!on && (!inView || matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    const wait = !on ? REST_MS : tapped.current ? TAP_HOLD_MS : HOLD_MS;
    const t = setTimeout(() => {
      tapped.current = false;
      setOn((v) => !v);
    }, wait);
    return () => clearTimeout(t);
  }, [on, inView, taps]);

  return (
    <div
      ref={box}
      className="rm-mag-touch"
      data-attract={on ? "" : undefined}
      onClick={() => {
        tapped.current = !on;
        setOn((v) => !v);
        setTaps((n) => n + 1);
      }}
    >
      {children}
    </div>
  );
}
