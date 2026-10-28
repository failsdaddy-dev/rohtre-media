"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// A thin red bar at the very top while an admin page loads (the admin waits
// for the server on every navigation). It starts when a link to another
// admin page is clicked, creeps towards the end, and finishes once the new
// page is shown. Purely visual; the page's own "Loading" status is announced.

export function AdminProgress() {
  const path = usePathname();
  const [startedOn, setStartedOn] = useState<string | null>(null);
  // The page changed: the bar finishes (state adjusted during render).
  if (startedOn !== null && startedOn !== path) setStartedOn(null);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith("/admin")) return;
      if (url.pathname === location.pathname) return;
      setStartedOn(location.pathname);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);

  return <div aria-hidden="true" className="rm-admin-progress" data-on={startedOn !== null ? "" : undefined} />;
}
