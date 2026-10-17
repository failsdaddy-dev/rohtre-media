import Link from "next/link";
import { ArrowRightIcon } from "./icons";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

// Header on every page, landing pages included (R8), with Book a Call always
// visible (R13). Over a dark hero it starts transparent with a white logo and
// turns solid white as the page scrolls (CSS only, see design.css).

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

export const BOOK_CALL_HREF = "/contact#enquiry";

export function SiteHeader() {
  return (
    <header className="rm-header sticky top-0 z-30">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="rm-header-logos shrink-0 rounded-md" aria-label="RohTre Media home">
          <span className="rm-header-on-hero">
            <Logo tone="white" className="h-8 w-auto sm:h-9" />
          </span>
          <span className="rm-header-on-solid">
            <Logo tone="black" className="h-8 w-auto sm:h-9" />
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rm-nav-link rounded-full px-3.5 py-2 text-[15px] font-medium text-fg-2 transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={BOOK_CALL_HREF}
            data-track="book_call_click"
            className="rm-press hidden h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg sm:inline-flex"
          >
            Book a Call <ArrowRightIcon size={16} />
          </Link>
          <MobileMenu items={NAV} bookHref={BOOK_CALL_HREF} />
        </div>
      </div>
    </header>
  );
}
