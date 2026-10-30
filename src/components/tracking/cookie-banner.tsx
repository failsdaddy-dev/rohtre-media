"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ACCEPT_ALL, consentSnapshot, REJECT_ALL, saveConsent, subscribeConsent } from "@/lib/cookie-consent";

// Shown until the visitor chooses. Accept and Reject are equal buttons, and
// nothing optional runs before a choice (see lib/cookie-consent.ts).
export function CookieBanner() {
  const chosen = useSyncExternalStore(subscribeConsent, () => consentSnapshot() !== "", () => true);
  if (chosen) return null;

  const button = "rm-press h-11 flex-1 rounded-full px-4 text-sm font-semibold";
  return (
    <section
      aria-label="Cookie choices"
      className="fixed bottom-5 left-5 z-50 w-[min(420px,calc(100vw-2.5rem))] border border-black/10 bg-white p-5 text-[#0a0a0a] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45)] max-sm:bottom-0 max-sm:left-0 max-sm:w-full"
    >
      <p className="text-[15px] font-bold">Your cookie choices</p>
      <p className="mt-2 text-sm leading-relaxed text-[#3a4250]">
        We use optional cookies to measure visits and improve our ads. They stay off unless you accept them.{" "}
        <Link href="/cookie-settings" className="font-semibold underline underline-offset-2">
          Manage choices
        </Link>
      </p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={() => saveConsent(REJECT_ALL)} className={`${button} bg-[#0a0a0a] text-white`}>
          Reject all
        </button>
        <button type="button" onClick={() => saveConsent(ACCEPT_ALL)} className={`${button} bg-brand text-brand-fg`}>
          Accept all
        </button>
      </div>
    </section>
  );
}
