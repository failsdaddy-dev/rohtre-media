"use client";

import { useEffect, useRef } from "react";
import { CTA_DECOR } from "@/content/layout-presets";
import { lerp, parallaxAllowed, pointerOffset, settled } from "@/lib/parallax";

// Makes the CTA card's objects drift with the pointer while it is over the
// card (three depth layers; each object reads --px/--py and its own
// --travel), easing back to rest when it leaves. requestAnimationFrame only
// while moving, passive listeners, transform only (CSS `translate`), and
// the card's size is read once per hover, not on every move. Nothing runs
// for touch (coarse) pointers or reduced motion. It also pauses the idle
// float while the card is off screen.

export function CtaParallax() {
  const probe = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = probe.current?.closest<HTMLElement>("[data-cta-card]");
    if (!card) return;

    const seen = new IntersectionObserver(([entry]) => {
      card.toggleAttribute("data-offscreen", !entry.isIntersecting);
      if (!entry.isIntersecting) stop();
    });
    seen.observe(card);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let frame = 0;
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    if (!parallaxAllowed(reduce, coarse)) return () => seen.disconnect();

    let rect: DOMRect | null = null;
    let target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    const tick = () => {
      now.x = lerp(now.x, target.x, CTA_DECOR.lerp);
      now.y = lerp(now.y, target.y, CTA_DECOR.lerp);
      card.style.setProperty("--px", now.x.toFixed(4));
      card.style.setProperty("--py", now.y.toFixed(4));
      frame = settled(now.x, target.x) && settled(now.y, target.y) ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const enter = () => {
      rect = card.getBoundingClientRect();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      rect ??= card.getBoundingClientRect();
      target = pointerOffset(e.clientX, e.clientY, rect);
      kick();
    };
    const leave = () => {
      rect = null;
      target = { x: 0, y: 0 };
      kick();
    };
    const stale = () => {
      rect = null;
    };
    card.addEventListener("pointerenter", enter, { passive: true });
    card.addEventListener("pointermove", move, { passive: true });
    card.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("scroll", stale, { passive: true });
    window.addEventListener("resize", stale, { passive: true });
    return () => {
      stop();
      seen.disconnect();
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", stale);
      window.removeEventListener("resize", stale);
    };
  }, []);

  return <span ref={probe} hidden />;
}
