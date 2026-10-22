"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LogoutIcon } from "../icons";
import { ADMIN_TABS, type AdminTab } from "./ui";

// The admin's top navigation. From 1100 px: the primary items in a row, a
// "More" menu (Redirects & ads, Settings, Users, Audit log) and the account
// menu (Password, View website, Sign out). Below 1100 px everything sits in
// one "Menu" button, so nothing is ever clipped. Routes and role rules are
// the same as before (ADMIN_TABS). Menus close with Escape, an outside
// click, or a navigation.

const isOn = (href: string, current: string) => (href === "/admin" ? current === "/admin" : current.startsWith(href));

const ITEM = "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium";
const itemLook = (on: boolean) => (on ? "bg-chip-on-bg text-chip-on-fg" : "hover:bg-chip-hover");

/** A button that opens a small panel; closes on Escape (focus back on the button) or a click outside. */
function Menu({
  label,
  button,
  children,
  align = "left",
  className = "",
}: {
  label: string;
  button: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  // Open on the page where it was opened: navigating anywhere closes it.
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (on: boolean) => setOpenAt(on ? path : null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpenAt(null);
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenAt(null);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="rm-press inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-chip-hover"
      >
        {button}
      </button>
      {open && (
        <div
          id={id}
          className={`absolute top-[calc(100%+6px)] z-40 flex w-64 max-w-[calc(100vw-2rem)] flex-col gap-1 rounded-2xl border border-line bg-bg-elev p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)] ${align === "right" ? "right-0" : "left-0"}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const Caret = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

function NavLink({ tab, current }: { tab: AdminTab; current: string }) {
  const on = isOn(tab.href, current);
  return (
    <Link href={tab.href} aria-current={on ? "page" : undefined} className={`${ITEM} ${itemLook(on)}`}>
      {tab.label}
    </Link>
  );
}

function SignOut() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={`${ITEM} w-full gap-2 hover:bg-chip-hover`}>
        <LogoutIcon size={16} /> Sign out
      </button>
    </form>
  );
}

export function AdminNav({
  canManage,
  isOwner,
  account,
}: {
  canManage: boolean;
  isOwner: boolean;
  account: { name: string; role: string };
}) {
  const current = usePathname();
  const tabs = ADMIN_TABS.filter((t) => (!t.manage || canManage) && (!t.owner || isOwner));
  const primary = tabs.filter((t) => t.group === "primary");
  const more = tabs.filter((t) => t.group === "more");
  const mine = tabs.filter((t) => t.group === "account");
  const moreOn = more.some((t) => isOn(t.href, current));
  const initial = account.name.slice(0, 1) || "?";

  const accountHead = (
    <div className="mb-1 border-b border-line px-3 pb-3 pt-2">
      <p className="truncate text-sm font-semibold">{account.name}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-fg-2">{account.role}</p>
    </div>
  );
  const accountItems = (
    <>
      {mine.map((t) => (
        <NavLink key={t.href} tab={t} current={current} />
      ))}
      <Link href="/" target="_blank" className={`${ITEM} hover:bg-chip-hover`}>
        View website ↗
      </Link>
      <SignOut />
    </>
  );

  return (
    <>
      {/* 1100 px and wider: the row. */}
      <nav aria-label="Admin" className="hidden min-w-0 flex-1 items-center gap-1 min-[1100px]:flex">
        {primary.map((t) => (
          <NavLink key={t.href} tab={t} current={current} />
        ))}
        {more.length > 0 && (
          <Menu
            label="More admin pages"
            button={
              <span className={`flex items-center gap-1.5 ${moreOn ? "text-brand" : ""}`}>
                More <Caret />
              </span>
            }
          >
            {more.map((t) => (
              <NavLink key={t.href} tab={t} current={current} />
            ))}
          </Menu>
        )}
      </nav>
      <Menu
        label="Account"
        align="right"
        className="hidden min-[1100px]:block"
        button={
          <>
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full bg-brand text-sm font-bold uppercase text-brand-fg"
            >
              {initial}
            </span>
            <span className="hidden max-w-[160px] truncate min-[1280px]:inline">{account.name}</span>
            <Caret />
          </>
        }
      >
        {accountHead}
        {accountItems}
      </Menu>

      {/* Narrower: one menu with everything. */}
      <Menu
        label="Menu"
        align="right"
        className="min-[1100px]:hidden"
        button={
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            Menu
          </>
        }
      >
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {[...primary, ...more].map((t) => (
            <NavLink key={t.href} tab={t} current={current} />
          ))}
        </nav>
        <div className="mt-1 border-t border-line pt-2">
          {accountHead}
          {accountItems}
        </div>
      </Menu>
    </>
  );
}
