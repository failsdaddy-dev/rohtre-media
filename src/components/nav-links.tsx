"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The header's desktop links. The current page's link is marked
// (aria-current, red): a section stays current on its sub-pages, so Work is
// current on /work/<brand> too.

export const isCurrent = (path: string, href: string) =>
  href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isCurrent(path, item.href) ? "page" : undefined}
          className="rm-nav-link whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-medium text-fg-2 transition-colors hover:text-brand xl:px-3.5"
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}
