"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./ui";

// The sticky bar at the bottom of an admin form: what state the form is in
// ("Saved", "Unsaved changes", "Saving…", or the last error), Discard, and
// the page's own save button. While there are unsaved edits, closing or
// reloading the tab asks first (the browser's own prompt), and clicking a
// link inside the admin asks in this bar ("Leave without saving?"), never a
// pop-up. Saving itself stays with each page (same calls as before).
// When nothing is unsaved the bar is gone; right after a save a small
// "Saved" pill shows for 2.5 s, so it never covers the form. With unsaved
// edits the full bar shows; it can also be hidden by
// hand (▾) and brought back (▴). It always opens again for an error or the
// leave question.

/** Asks before the page is closed or a link is followed while `dirty`. */
export function useLeaveGuard(dirty: boolean) {
  const [leaving, setLeaving] = useState<string | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || a.getAttribute("target") === "_blank" || a.hasAttribute("download")) return;
      const href = (a as HTMLAnchorElement).href;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaving(href);
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  return {
    leaving,
    stay: () => setLeaving(null),
    leave: () => {
      if (leaving) location.assign(leaving);
    },
  };
}

export function SaveBar({
  dirty,
  pending,
  message,
  onDiscard,
  children,
  idle = "Saved",
}: {
  dirty: boolean;
  pending: boolean;
  /** The last save's result (shown until the next edit). */
  message?: { tone: "ok" | "error"; text: string } | null;
  onDiscard?: () => void;
  /** The save button(s). */
  children: ReactNode;
  /** What the bar says when nothing has changed. */
  idle?: string;
}) {
  const guard = useLeaveGuard(dirty && !pending);
  const [hidden, setHidden] = useState(false);
  const error = message?.tone === "error" && !pending;
  const compact = !guard.leaving && !error && !pending && (hidden || !dirty);
  // "Saved" shows for a moment after a save, then the bar goes away until the
  // next edit, so it never sits over the page when there is nothing to save.
  const okText = message?.tone === "ok" ? message.text : null;
  // The pill shows while okText is new; 2.5 s later that text is marked as
  // shown (state set from the timer, not during the effect itself).
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!okText) return;
    const t = setTimeout(() => setShown(okText), 2500);
    return () => clearTimeout(t);
  }, [okText]);
  // When the message clears, forget it, so the same text flashes again on the next save.
  if (okText === null && shown !== null) setShown(null);
  const flash = okText !== null && shown !== okText;
  const text = pending
    ? "Saving…"
    : message?.tone === "error"
      ? message.text
      : dirty
        ? "Unsaved changes"
        : (message?.text ?? idle);

  if (compact && !dirty && !flash) return null;

  if (compact) {
    return (
      <div className="sticky bottom-4 z-20 ml-auto flex w-fit items-center gap-1 self-end rounded-full border border-line bg-bg-elev py-1 pl-4 pr-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]">
        <p role="status" className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={`size-2.5 shrink-0 rounded-full ${dirty ? "bg-[#f5a524]" : "bg-[#1f7a3a]"}`}
          />
          {dirty ? "Unsaved changes" : "Saved"}
        </p>
        {dirty ? (
          <Button variant="ghost" className="h-9 px-3" onClick={() => setHidden(false)} aria-label="Show the save bar">
            Show ▴
          </Button>
        ) : (
          <span className="w-3" />
        )}
      </div>
    );
  }

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-[28px] border border-line bg-bg-elev p-2 pl-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]">
      {guard.leaving ? (
        <>
          <p role="alert" className="min-w-0 flex-1 text-sm font-semibold">
            Leave without saving? Your changes will be lost.
          </p>
          <Button onClick={guard.stay}>Stay</Button>
          <Button variant="danger" onClick={guard.leave}>
            Leave
          </Button>
        </>
      ) : (
        <>
          <p
            role="status"
            className={`flex min-w-0 flex-1 items-center gap-2 text-sm ${message?.tone === "error" && !pending ? "font-medium text-danger" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`size-2.5 shrink-0 rounded-full ${dirty ? "bg-[#f5a524]" : message?.tone === "error" ? "bg-danger" : "bg-[#1f7a3a]"}`}
            />
            {text}
          </p>
          {onDiscard && dirty && !pending && (
            <Button variant="ghost" onClick={onDiscard}>
              Discard
            </Button>
          )}
          {children}
          {!error && !pending && (
            <Button variant="ghost" className="w-10 px-0" onClick={() => setHidden(true)} aria-label="Hide the save bar">
              ▾
            </Button>
          )}
        </>
      )}
    </div>
  );
}
