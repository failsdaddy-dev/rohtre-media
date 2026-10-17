"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, type Theme } from "@/lib/theme";

// The <html data-theme> attribute (or, without it, the system setting) is the
// source of truth; this switch only reads and flips it.
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return media().matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const mq = media();
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  mq.addEventListener("change", onChange);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", onChange);
  };
}

function SunIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function ThemeToggle() {
  // Server render assumes light; the real value is read on hydration.
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);
  const dark = theme === "dark";
  const flip = () => {
    const next: Theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode: the choice lasts for this page only */
    }
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={flip}
      className="relative flex h-8 w-[60px] shrink-0 items-center justify-between rounded-full bg-chip px-2 text-fg-2 hover:bg-chip-hover"
    >
      <SunIcon />
      <MoonIcon />
      <span
        aria-hidden="true"
        className={`absolute left-1 top-1 grid size-6 place-items-center rounded-full bg-brand text-brand-fg shadow transition-transform duration-[var(--dur-2)] ease-[var(--ease)] ${
          dark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {dark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}
