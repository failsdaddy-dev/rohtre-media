"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./ui";

// The sticky bar at the bottom of an admin form: what state the form is in
// ("Saved", "Unsaved changes", "Saving…", or the last error), Discard, and
// the page's own save button. While there are unsaved edits, closing or
// reloading the tab asks first (the browser's own prompt), and clicking a
// link inside the admin asks in this bar ("Leave without saving?"), never a
// pop-up. Saving itself stays with each page (same calls as before).

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
  const text = pending
    ? "Saving…"
    : message?.tone === "error"
      ? message.text
      : dirty
        ? "Unsaved changes"
        : (message?.text ?? idle);

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
        </>
      )}
    </div>
  );
}
