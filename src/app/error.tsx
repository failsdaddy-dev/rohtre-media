"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-fg-2">Please try again. If it keeps happening, contact us on WhatsApp or email.</p>
      <button
        type="button"
        onClick={reset}
        className="rm-press inline-flex h-12 items-center rounded-full bg-chip-on-bg px-6 font-semibold text-chip-on-fg"
      >
        Try again
      </button>
    </main>
  );
}
