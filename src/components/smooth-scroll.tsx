"use client";

import { useEffect } from "react";

// Smooth, eased page scrolling with Lenis (the same technique as the
// reference site). Loaded after the page is interactive and skipped for
// people who prefer reduced motion. Anchor links (#enquiry) scroll smoothly
// too. Lenis is about 4 KB gzipped. verified: https://github.com/darkroomengineering/lenis
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ autoRaf: true, lerp: 0.1, anchors: { offset: -88 } });
      destroy = () => lenis.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);
  return null;
}
