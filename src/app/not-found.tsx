import Link from "next/link";
import { SiteChrome } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <SiteChrome>
      <section className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <p className="text-7xl font-bold tracking-[-0.05em] text-brand">404</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="max-w-md text-fg-2">The page you’re looking for doesn’t exist or has moved.</p>
        <Link
          href="/"
          className="rm-press mt-2 inline-flex h-12 items-center rounded-full bg-chip-on-bg px-6 font-semibold text-chip-on-fg"
        >
          Go to the home page
        </Link>
      </section>
    </SiteChrome>
  );
}
