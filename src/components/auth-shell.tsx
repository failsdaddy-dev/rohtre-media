import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./logo";

// Frame for sign-in and "no access" (R44), matching RohTre Vault: an animated
// red striped brand panel on the left (a band on phones) and the content in a
// card that sits on a red offset block.

const COLUMNS = 6;

function StripePanel({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex">
        {Array.from({ length: COLUMNS }, (_, i) => (
          <div
            key={i}
            style={{ "--i": i } as CSSProperties}
            className="rm-panel-col rm-stripes h-full flex-1 border-r border-[var(--stripe-line)] last:border-r-0"
          />
        ))}
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative hidden lg:block">
        <StripePanel className="absolute inset-0" />
        <div className="rm-rise-in relative flex h-full flex-col justify-between p-10 text-[var(--stripe-fg)] [--i:5]">
          <Link href="/" className="w-fit rounded-md">
            <Logo className="h-9 w-auto" />
          </Link>
          <div>
            <p className="text-[clamp(2.5rem,4.2vw,4rem)] font-bold leading-[0.95] tracking-[-0.04em]">
              ROHTRE
              <br />
              MEDIA
            </p>
            <p className="mt-4 max-w-sm text-base opacity-80">
              Website admin: pages, images, leads and settings in one place.
            </p>
          </div>
          <p className="text-xs opacity-70">For the RohTre Media team only</p>
        </div>
      </div>

      <div className="flex min-h-dvh flex-col">
        <StripePanel className="relative h-24 lg:hidden" />
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="rounded-md lg:invisible" aria-label="RohTre Media home">
            <Logo className="h-8 w-auto" />
          </Link>
        </header>
        <main id="main" className="flex flex-1 items-center justify-center px-5 pb-16 pt-4 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/** The card the form or message sits in. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rm-offset rm-pop-in w-full max-w-[420px] p-8 [--offset-surface:var(--bg-elev)] max-sm:p-6">
      <div className="relative">{children}</div>
    </div>
  );
}
