"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ACCEPT_ALL,
  consentSnapshot,
  readConsent,
  REJECT_ALL,
  saveConsent,
  subscribeConsent,
  type CookieChoice,
} from "@/lib/cookie-consent";

// The switches on the Cookie Settings page. Essential cookies are always on.

const ROWS: { key: keyof CookieChoice; label: string }[] = [
  { key: "analytics", label: "Analytics cookies" },
  { key: "marketing", label: "Marketing cookies" },
  { key: "functional", label: "Functional cookies" },
];

function Row({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange?: (on: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 border-t border-black/10 py-3.5 text-[15px] font-semibold">
      {label}
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
    </label>
  );
}

function Controls({ ready }: { ready: boolean }) {
  const [choice, setChoice] = useState<CookieChoice>((ready && readConsent()) || REJECT_ALL);
  const [saved, setSaved] = useState(false);
  const save = (next: CookieChoice) => {
    setChoice(next);
    saveConsent(next);
    setSaved(true);
  };
  const button = "rm-legal-button";

  return (
    <section aria-labelledby="cookie-controls-title" className="rm-svc rm-legal-card">
      <div className="rm-legal-body">
        <h2 id="cookie-controls-title" className="mb-3 text-[1.35rem] font-bold tracking-[-0.03em]">
          Your cookie choices
        </h2>
        <Row label="Essential cookies (always on)" checked disabled />
        {ROWS.map((r) => (
          <Row
            key={r.key}
            label={r.label}
            checked={choice[r.key]}
            disabled={!ready}
            onChange={(on) => {
              setChoice({ ...choice, [r.key]: on });
              setSaved(false);
            }}
          />
        ))}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className={button} onClick={() => save(choice)}>
            Save choices
          </button>
          <button type="button" className={`${button} is-ghost`} onClick={() => save(ACCEPT_ALL)}>
            Accept all
          </button>
          <button type="button" className={`${button} is-ghost`} onClick={() => save(REJECT_ALL)}>
            Reject all
          </button>
        </div>
        <p aria-live="polite" className="mt-3 min-h-5 text-sm font-semibold">
          {saved ? "Your choices are saved." : ""}
        </p>
      </div>
    </section>
  );
}

export function CookieControls() {
  // null on the server; the saved choice is only readable in the browser.
  const client = useSyncExternalStore(subscribeConsent, consentSnapshot, () => null) !== null;
  return <Controls key={String(client)} ready={client} />;
}
