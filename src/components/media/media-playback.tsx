"use client";

import { useEffect } from "react";
import { MAX_PLAYING_VIDEOS } from "@/lib/media-limits";

// Starts and stops the looping clips (video[data-rm-loop], see MediaSlot).
// A clip gets its file only when it first scrolls into view, plays while it
// is on screen and pauses when it leaves. At most MAX_PLAYING_VIDEOS play at
// once (the first ones on the page win). Nothing starts before the page has
// loaded, so the hero's still image stays the LCP element.
//
// Apple devices: Safari refuses to autoplay in Low Power Mode (and some other
// settings). Then, and for people who prefer reduced motion or turn on data
// saver, each clip shows its play button (button[data-rm-play]) instead, and
// the first tap anywhere on the page retries the clips on screen.

export function MediaPlayback() {
  useEffect(() => {
    const clips = [...document.querySelectorAll<HTMLVideoElement>("video[data-rm-loop]")];
    if (clips.length === 0) return;

    const buttonOf = (v: HTMLVideoElement) => v.parentElement?.querySelector<HTMLButtonElement>("button[data-rm-play]");
    const showButton = (v: HTMLVideoElement, show: boolean) => {
      const b = buttonOf(v);
      if (b) b.hidden = !show;
    };
    const load = (v: HTMLVideoElement) => {
      // Safari checks the muted state when play() runs; set it explicitly.
      v.muted = true;
      v.defaultMuted = true;
      if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src;
    };
    const tryPlay = (v: HTMLVideoElement) => {
      load(v);
      v.play().catch((err: unknown) => {
        // Blocked by the device (not just interrupted by a pause): offer the button.
        if (err instanceof DOMException && err.name === "NotAllowedError") showButton(v, true);
      });
    };

    const onPlaying = (e: Event) => {
      const v = e.target as HTMLVideoElement;
      v.dataset.playing = "";
      showButton(v, false);
    };
    const buttons: [HTMLButtonElement, () => void][] = [];
    for (const v of clips) {
      v.addEventListener("playing", onPlaying);
      const b = buttonOf(v);
      if (b) {
        const onClick = () => {
          v.dataset.userStarted = "";
          tryPlay(v);
        };
        b.addEventListener("click", onClick);
        buttons.push([b, onClick]);
      }
    }

    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const stillOnly = saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const inView = new Set<HTMLVideoElement>();

    const sync = () => {
      const allowed = new Set(clips.filter((v) => inView.has(v)).slice(0, MAX_PLAYING_VIDEOS));
      for (const v of clips) {
        if (allowed.has(v)) {
          if (v.paused && (!stillOnly || v.dataset.userStarted !== undefined)) tryPlay(v);
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
    // A tap counts as permission on Apple devices: retry whatever is on screen.
    const onFirstTap = () => sync();
    const start = () => {
      if (stillOnly) for (const v of clips) showButton(v, true);
      for (const v of clips) observer.observe(v);
      if (!stillOnly) document.addEventListener("touchend", onFirstTap, { once: true, passive: true });
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      document.removeEventListener("touchend", onFirstTap);
      observer.disconnect();
      for (const [b, onClick] of buttons) b.removeEventListener("click", onClick);
      for (const v of clips) {
        v.removeEventListener("playing", onPlaying);
        v.pause();
      }
    };
  }, []);
  return null;
}
