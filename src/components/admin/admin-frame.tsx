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
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3 rounded-md">
            <Logo className="h-7 w-auto" />
            <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-fg">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-fg-2 sm:inline">
              {staff.name ?? staff.email} · <span className="capitalize">{staff.role}</span>
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="grid size-9 place-items-center rounded-full hover:bg-hover"
              >
                <LogoutIcon size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
        <AdminTabs current={current} canManage={canManage(staff.role)} />
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
