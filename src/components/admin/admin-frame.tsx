import Link from "next/link";
import type { ReactNode } from "react";
import { canManage, type Staff } from "@/lib/auth";
import { LogoutIcon } from "../icons";
import { Logo } from "../logo";
import { AdminTabs } from "./ui";

export function AdminFrame({
  staff,
  current,
  title,
  children,
}: {
  staff: Staff;
  current: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3 rounded-md">
            <Logo className="h-7 w-auto" />
            <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-fg">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden h-9 items-center rounded-full px-3 text-sm text-fg-2 transition-colors hover:bg-hover hover:text-fg md:inline-flex"
            >
              View website ↗
            </Link>
            <div className="flex items-center gap-2.5 rounded-full border border-line bg-bg-elev py-1 pl-1 pr-3">
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-brand text-sm font-bold uppercase text-brand-fg"
              >
                {(staff.name ?? staff.email ?? "?").slice(0, 1)}
              </span>
              <span className="hidden min-w-0 flex-col leading-tight sm:flex">
                <span className="max-w-[220px] truncate text-sm font-semibold">{staff.name ?? staff.email}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-fg-2">{staff.role}</span>
              </span>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                title="Sign out"
                className="rm-press inline-flex h-9 items-center gap-2 rounded-full bg-chip-on-bg px-3 text-sm font-semibold text-chip-on-fg sm:px-4"
              >
                <LogoutIcon size={16} />
                <span className="max-sm:sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
        <AdminTabs current={current} canManage={canManage(staff.role)} isOwner={staff.role === "owner"} />
        <h1 className="pb-5 pt-3 text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function AdminLoading() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-24 text-center text-fg-2 sm:px-6" role="status">
      Loading…
    </div>
  );
}
