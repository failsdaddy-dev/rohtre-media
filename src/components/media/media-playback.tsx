"use client";

import { useEffect } from "react";
import { MAX_PLAYING_VIDEOS } from "@/lib/media-limits";

// Starts and stops the looping clips (video[data-rm-loop], see MediaSlot).
// A clip gets its file only when it first scrolls into view, plays while it
// is on screen and pauses when it leaves. At most MAX_PLAYING_VIDEOS play at
// once (the first ones on the page win). Nothing starts before the page has
// loaded, so the hero's still image stays the LCP element. The hero clip
// autoplays on its own (native autoplay); this only pauses it off screen.
// People who prefer reduced motion or turn on data saver see still images.
// The first tap on the page retries the clips on screen (Apple devices treat
// a tap as permission to play).

export function MediaPlayback() {
  useEffect(() => {
    const clips = [...document.querySelectorAll<HTMLVideoElement>("video[data-rm-loop]")];
    if (clips.length === 0) return;

    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const v of clips) {
        v.autoplay = false;
        v.pause();
        delete v.dataset.playing;
      }
      return;
    }

    const tryPlay = (v: HTMLVideoElement) => {
      // Safari checks the muted state when play() runs; set it explicitly.
      v.muted = true;
      v.defaultMuted = true;
      if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    };
    const inView = new Set<HTMLVideoElement>();
    const sync = () => {
      const allowed = new Set(clips.filter((v) => inView.has(v)).slice(0, MAX_PLAYING_VIDEOS));
      for (const v of clips) {
        if (allowed.has(v)) {
          if (v.paused) tryPlay(v);
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
    const onFirstTap = () => sync();
    const start = () => {
      for (const v of clips) {
        v.addEventListener("playing", onPlaying);
        observer.observe(v);
      }
      document.addEventListener("touchend", onFirstTap, { once: true, passive: true });
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      document.removeEventListener("touchend", onFirstTap);
      observer.disconnect();
      for (const v of clips) {
        v.removeEventListener("playing", onPlaying);
        v.pause();
      }
    };
  }, []);
  return null;
}
