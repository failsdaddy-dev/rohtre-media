import type { ReactNode } from "react";
import Link from "next/link";
import { canManage, type Staff } from "@/lib/auth";
import { Logo } from "../logo";
import { AdminNav } from "./admin-nav";

// Every admin page's frame: the header (logo, navigation, account menu) and
// the page title. `current` is kept for the pages that pass it; the
// navigation reads the path itself.

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
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-3 rounded-md">
            <Logo className="h-7 w-auto" />
            <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-fg">
              Admin
            </span>
          </Link>
          <AdminNav
            canManage={canManage(staff.role)}
            isOwner={staff.role === "owner"}
            account={{ name: staff.name ?? staff.email ?? "Account", role: staff.role }}
          />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-6">
        <h1 className="pb-5 pt-6 text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function AdminLoading() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-24 text-center text-fg-2 sm:px-6" role="status">
      Loading…
    </div>
  );
}
