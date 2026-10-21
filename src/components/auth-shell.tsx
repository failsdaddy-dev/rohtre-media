import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon } from "./icons";
import { Logo } from "./logo";

// Frame for sign-in and "no access" (R44), in the main website's look: a
// full-screen dark band with drifting light beams, a fine grid and a red
// glow (like the home hero), a pill label and a two-tone headline, and the
// form in a glow card that lights up in brand colours on hover or focus.

const at = (i: number) => ({ "--i": i }) as CSSProperties;

export function AuthShell({
  eyebrow = "Team access",
  title = "Welcome back to",
  accent = "RohTre Media",
  children,
}: {
  eyebrow?: string;
  title?: string;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <div className="rm-dark rm-beams relative flex min-h-dvh flex-col overflow-hidden text-fg">
      <div aria-hidden="true" className="rm-grid-bg rm-glow pointer-events-none absolute inset-0" />
      <header className="relative flex items-center justify-between px-5 py-5 sm:px-10">
        <Link href="/" className="rounded-md" aria-label="RohTre Media home">
          <Logo tone="white" className="h-8 w-auto sm:h-9" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-fg-2 transition-colors hover:text-fg"
        >
          Back to website <ArrowRightIcon size={16} />
        </Link>
      </header>

      <main id="main" className="relative flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-6 sm:px-8">
        <p className="rm-rise-in" style={at(0)}>
          <span className="rm-pill mb-6">{eyebrow}</span>
        </p>
        <h1
          style={at(1)}
          className="rm-rise-in mb-10 text-center text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.04em]"
        >
          {title} <span className="rm-text-grad block pb-1">{accent}</span>
        </h1>
        <div style={at(2)} className="rm-rise-in w-full max-w-[440px]">
          {children}
        </div>
      </main>

      <footer className="relative px-5 pb-6 text-center text-xs text-fg-2 sm:px-10">
        For the RohTre Media team only · No public sign-up
      </footer>
    </div>
  );
}

/** The glow card the form or message sits in. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rm-glow-card">
      <span aria-hidden="true" className="rm-glow-face" />
      <div className="p-8 max-sm:p-6">{children}</div>
    </div>
  );
}
