import Link from "next/link";
import { cacheLife } from "next/cache";
import type { SiteSettings } from "@/lib/settings-schema";
import { footerSocials } from "@/lib/social-links";
import { BrandIcon } from "./brand-icons";
import { MailIcon, PhoneIcon, PinIcon } from "./icons";
import { Logo } from "./logo";
import { BOOK_CALL_HREF } from "./site-header";

// Footer on every page (R8, R12). Contact details and social links come
// from global settings (saving them refreshes every page). Social icons
// follow the render rule in src/lib/social-links.ts.

/** Outside production, switched-on icons without a link show dimmed so the row can be reviewed. */
const SHOW_UNLINKED = process.env.NODE_ENV !== "production";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];
const LEGAL = [
  { href: "/privacy", label: "Privacy Notice" },
  { href: "/terms", label: "Terms of Service" },
];

export async function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = await currentYear();
  const socials = footerSocials(settings.socials, SHOW_UNLINKED);
  const heading = "text-xs font-semibold uppercase tracking-[0.2em] text-fg-2";
  const link = "text-[15px] text-fg-2 transition-colors hover:text-fg";

  return (
    <footer className="rm-dark rm-glow mt-auto">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1.5fr_0.8fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <Logo className="h-10 w-auto self-start" />
          <p className="text-xl font-bold tracking-[-0.02em]">{settings.tagline}</p>
          <Link
            href={BOOK_CALL_HREF}
            data-track="book_call_click"
            className="rm-press inline-flex h-11 items-center self-start rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg"
          >
            Book a Call
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <p className={heading}>Contact</p>
          <a href={`mailto:${settings.email}`} className={`${link} flex items-center gap-2.5`}>
            <MailIcon size={18} className="shrink-0" />
            {settings.email}
          </a>
          {settings.phones.map((p) => (
            <a
              key={p.tel}
              href={`tel:${p.tel}`}
              data-track="call_click"
              className={`${link} flex items-center gap-2.5`}
            >
              <PhoneIcon size={18} className="shrink-0" />
              {/* The number never breaks across lines; only "label:" may wrap above it. */}
              <span>
                {p.label}: <span className="whitespace-nowrap">{p.display}</span>
              </span>
            </a>
          ))}
          {settings.callbackCountries.map((c) => (
            <Link key={c.country} href="/contact#enquiry" className={`${link} flex items-center gap-2.5`}>
              <PhoneIcon size={18} className="shrink-0" />
              <span>{c.label}: Get a Callback →</span>
            </Link>
          ))}
          <p className="flex items-start gap-2.5 text-[15px] text-fg-2">
            <PinIcon size={18} className="mt-0.5 shrink-0" />
            <span>{settings.address ?? settings.location}</span>
          </p>
        </div>

        <nav aria-label="Company" className="flex flex-col gap-3">
          <p className={heading}>Company</p>
          {COMPANY.map((l) => (
            <Link key={l.href} href={l.href} className={link}>
              {l.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Legal" className="flex flex-col gap-3">
          <p className={heading}>Legal</p>
          {LEGAL.map((l) => (
            <Link key={l.href} href={l.href} className={link}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-line">
        {/* Copyright left, social icons right; stacked and centred on phones. */}
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-5 text-center text-sm text-fg-2 sm:px-6 md:flex-row md:justify-between md:text-left">
          <p>© {year} RohTre Media. All rights reserved.</p>
          {socials.length > 0 && (
            <ul aria-label="RohTre Media on social media" className="flex flex-wrap justify-center gap-2.5">
              {socials.map((s) => (
                <li key={s.network}>
                  {s.href ? (
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="rm-social"
                    >
                      <BrandIcon network={s.network} size={19} />
                    </a>
                  ) : (
                    <span role="img" aria-label={s.label} title="No link yet" className="rm-social" data-unlinked="">
                      <BrandIcon network={s.network} size={19} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
