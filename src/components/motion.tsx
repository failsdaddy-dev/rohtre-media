"use client";

import { useEffect } from "react";

// Scroll motion for the public site. It uses the Web Animations API
// (element.animate), which never changes HTML attributes, so it can't clash
// with React hydration even when parts of the page hydrate later.
//   [data-reveal]  fades and rises in when it enters the viewport. Its hidden
//                  start state comes from CSS (design.css); the animation's
//                  end state is kept (fill: "both"). Value "up-lg" rises
//                  further, "fade" doesn't rise. --d (inline) delays it.
//   .rm-fill-line  fills with white as it moves up the screen: a paused
//                  animation whose time follows the scroll position.
// New elements after client-side navigation are picked up automatically.

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const RISE: Record<string, string> = { "": "32px", "up-lg": "60px", fade: "0px" };

export function Motion() {
  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-motion")) return; // reduced motion: CSS shows everything

    const seen = new WeakSet<Element>();
    const lines = new Map<HTMLElement, Animation>();

    const reveal = (el: HTMLElement) => {
      const rise = RISE[el.dataset.reveal ?? ""] ?? RISE[""];
      const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) * 1000 || 0;
      el.animate(
        [
          { opacity: 0, transform: `translate3d(0, ${rise}, 0)` },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 800, delay, easing: EASE, fill: "both" },
      );
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          reveal(e.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const fill = () => {
      const h = window.innerHeight;
      lines.forEach((anim, line) => {
        if (!line.isConnected) {
          lines.delete(line);
          return;
        }
        const top = line.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, (h * 0.88 - top) / (h * 0.42)));
        anim.currentTime = p * 1000;
      });
    };

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
      document.querySelectorAll<HTMLElement>(".rm-fill-line").forEach((el) => {
        if (lines.has(el)) return;
        const anim = el.animate([{ backgroundPositionX: "100%" }, { backgroundPositionX: "0%" }], {
          duration: 1000,
          fill: "both",
        });
        anim.pause();
        lines.set(el, anim);
      });
      fill();
    };

    let frame = 0;
    const queue = (fn: () => void) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fn);
    };
    const onScroll = () => queue(fill);
    const mo = new MutationObserver(() => queue(scan));

    scan();
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
