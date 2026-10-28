import type { ReactNode } from "react";
import Link from "next/link";
import { canManage, type Staff } from "@/lib/auth";
import { Logo } from "../logo";
import { AdminNav } from "./admin-nav";
import { AdminProgress } from "./admin-progress";
import { AdminSearch } from "./admin-search";

// Every admin page's frame: the loading bar, the header (logo, navigation,
// quick find, account menu), a thin "live website" strip that says how
// changes reach the site, and the page title. `current` is kept for the
// pages that pass it; the navigation reads the path itself.

export function AdminFrame({
  staff,
  title,
  children,
}: {
  staff: Staff;
  current?: string;
  title: string;
  children: ReactNode;
}) {
  const manager = canManage(staff.role);
  return (
    <div className="min-h-dvh">
      <AdminProgress />
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-3 rounded-md">
            <Logo className="h-7 w-auto" />
            <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-fg">
              Admin
            </span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <AdminNav
              canManage={manager}
              isOwner={staff.role === "owner"}
              account={{ name: staff.name ?? staff.email ?? "Account", role: staff.role }}
            />
            <div className="order-first">
              <AdminSearch canManage={manager} isOwner={staff.role === "owner"} />
            </div>
          </div>
        </div>
        <LiveStrip />
      </header>
      <main id="main" className="rm-admin-in mx-auto max-w-[1320px] px-4 pb-16 sm:px-6">
        <h1 className="pb-5 pt-6 text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        {children}
      </main>
    </div>
  );
}

/** "Connected to the live website": how edits reach the site, and a link to it. */
function LiveStrip() {
  return (
    <div className="border-t border-line bg-[#0b0b0b] text-[12px] text-white/75">
      <div className="mx-auto flex h-8 max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6">
        <p className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="rm-live-dot ml-1" />
          <span className="font-semibold text-white">Live</span>
          <span className="truncate max-sm:hidden">
            Saved page edits go live in seconds · Landing pages go live when published
          </span>
        </p>
        <span className="flex shrink-0 items-center gap-4">
          <Link href="/admin/guide" className="font-semibold text-white hover:text-[#ff6b6b]">
            Help
          </Link>
          <Link href="/" target="_blank" className="font-semibold text-white hover:text-[#ff6b6b]">
            Open website ↗
          </Link>
        </span>
      </div>
    </div>
  );
}

/**
 * While an admin page loads: the red bar running across the top, a spinning
 * R-red ring with "Loading", and grey placeholder panels in the shape of
 * the page, so it never looks empty or stuck.
 */
export function AdminLoading() {
  return (
    <div className="min-h-dvh" role="status" aria-live="polite">
      <div aria-hidden="true" className="rm-admin-progress" data-on="" />
      <div className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_90%,transparent)]">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:px-6">
          <Logo className="h-7 w-auto opacity-60" />
          <span className="rm-skel h-5 w-14 rounded-md" />
          <span className="ml-auto flex gap-2 max-sm:hidden">
            {[72, 88, 64, 96, 70].map((w, i) => (
              <span key={i} className="rm-skel h-8 rounded-lg" style={{ width: w }} />
            ))}
          </span>
        </div>
        <div className="h-8 bg-[#0b0b0b]" />
      </div>
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="flex items-center gap-3 pb-5 pt-6">
          <span aria-hidden="true" className="rm-admin-spin" />
          <span className="text-sm font-semibold text-fg-2">Loading…</span>
        </div>
        <div className="flex flex-col gap-6">
          {[0, 1].map((p) => (
            <div key={p} className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
              <span className="rm-skel block h-6 w-48 rounded-md" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[0, 1, 2, 3].map((f) => (
                  <div key={f} className="flex flex-col gap-2">
                    <span className="rm-skel block h-4 w-28 rounded" />
                    <span className="rm-skel block h-11 w-full rounded-[14px]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
