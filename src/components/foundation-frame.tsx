import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

// Temporary frame used until the real header and footer arrive in Phase 1.
export function FoundationFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-4 sm:px-8">
        <Link href="/" className="rounded-md" aria-label="RohTre Media home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
