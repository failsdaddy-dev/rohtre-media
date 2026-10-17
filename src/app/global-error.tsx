"use client";

// Last resort when the root layout itself fails: plain HTML, no theme files.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Arial, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Something went wrong</h1>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </body>
    </html>
  );
}
