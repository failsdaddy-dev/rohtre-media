"use client";

import { useEffect } from "react";
import { MAX_PLAYING_VIDEOS } from "@/lib/media-limits";

// Starts and stops the looping clips (video[data-rm-loop], see MediaSlot).
// A clip gets its file only when it first scrolls into view, plays while it
// is on screen and pauses when it leaves. At most MAX_PLAYING_VIDEOS play at
// once (the first ones on the page win). Nothing starts before the page has
// loaded, so the hero's still image stays the LCP element. People who prefer
// reduced motion or turn on data saver only ever see the still image.

export function MediaPlayback() {
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const clips = [...document.querySelectorAll<HTMLVideoElement>("video[data-rm-loop]")];
    if (clips.length === 0) return;
    const inView = new Set<HTMLVideoElement>();

    const sync = () => {
      const allowed = new Set(clips.filter((v) => inView.has(v)).slice(0, MAX_PLAYING_VIDEOS));
      for (const v of clips) {
        if (allowed.has(v)) {
          if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src;
          if (v.paused) v.play().catch(() => {});
        } else if (!v.paused) v.pause();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) inView.add(v);
          else inView.delete(v);
        }
        sync();
      },
      { threshold: 0.25 },
    );
    const onPlaying = (e: Event) => ((e.target as HTMLElement).dataset.playing = "");
    const start = () => {
      for (const v of clips) {
        v.addEventListener("playing", onPlaying);
        observer.observe(v);
      }
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      observer.disconnect();
      for (const v of clips) {
        v.removeEventListener("playing", onPlaying);
        v.pause();
      }
    };
  }, []);
  return null;
}
