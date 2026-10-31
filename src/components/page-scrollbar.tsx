"use client";

import { useEffect, useRef, type PointerEvent } from "react";

// The page's scrollbar on devices with a mouse. The browser's own bar always
// reserves a strip beside the page that can't be made transparent, so it is
// hidden (globals.css) and this slim bar floats over the content instead. It
// can be dragged; wheel, keyboard and touch scrolling are untouched.

const MIN_HEIGHT = 48;

export function PageScrollbar() {
  const thumb = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; scroll: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = 0;
      const el = thumb.current;
      if (!el) return;
      const view = window.innerHeight;
      const full = document.documentElement.scrollHeight;
      el.hidden = full <= view + 1;
      const height = Math.max(MIN_HEIGHT, (view * view) / full);
      el.style.height = `${height}px`;
      el.style.transform = `translateY(${((view - height) * window.scrollY) / Math.max(1, full - view)}px)`;
    };
    const update = () => {
      frame ||= requestAnimationFrame(draw);
    };
    const size = new ResizeObserver(update);
    size.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      size.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, scroll: window.scrollY };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const view = window.innerHeight;
    const full = document.documentElement.scrollHeight;
    const travel = view - e.currentTarget.offsetHeight;
    window.scrollTo(0, drag.current.scroll + ((e.clientY - drag.current.y) * (full - view)) / Math.max(1, travel));
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <div
      ref={thumb}
      aria-hidden="true"
      hidden
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="rm-page-scrollbar"
    />
  );
}
