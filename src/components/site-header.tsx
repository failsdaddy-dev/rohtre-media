import Link from "next/link";
import { DEFAULT_HEADER_TONE, type HeaderTone } from "@/lib/header-tone";
import { ArrowRightIcon } from "./icons";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

// Header on every page, landing pages included (R8), with Book a Call always
// visible (R13). Its look at the top of the page comes from `tone`, set on the
// server by the page's route-group layout and written to data-tone, so the
// right colours are in the first paint (no flash, no layout shift). Once the
// page is scrolled every tone becomes the same white bar (CSS in design.css).

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

export const BOOK_CALL_HREF = "/contact#enquiry";

export function SiteHeader({ tone = DEFAULT_HEADER_TONE }: { tone?: HeaderTone }) {
  return (
    <header className="rm-header sticky top-0 z-30" data-tone={tone}>
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
            className="rm-press inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg md:h-12 md:px-6 md:text-[15px]"
          >
            Book a Call <ArrowRightIcon size={16} className="hidden md:block" />
          </Link>
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
