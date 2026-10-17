import Link from "next/link";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";

// Header on every page, landing pages included (R8). Book a Call is always
// visible (R13).

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

export const BOOK_CALL_HREF = "/contact#enquiry";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 rounded-md" aria-label="RohTre Media home">
          <Logo className="h-8 w-auto sm:h-9" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[15px] font-medium text-fg-2 transition-colors hover:bg-hover hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href={BOOK_CALL_HREF}
            data-track="book_call_click"
            className="rm-press hidden h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg sm:inline-flex"
          >
            Book a Call
          </Link>
          <MobileMenu items={NAV} bookHref={BOOK_CALL_HREF} />
        </div>
      </div>
    </header>
  );
}
