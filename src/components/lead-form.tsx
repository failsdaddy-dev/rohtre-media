"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { loadAttribution } from "@/lib/attribution";
import { CONSENT_TEXT } from "@/lib/consent";
import { pushDataLayer } from "@/lib/data-layer";
import { generateEventId, META_CONVERSION_SEND_ENQUIRY, trackMetaConversion } from "@/lib/meta-pixel";
import { track } from "@/lib/track";
import { ArrowRightIcon, CheckIcon } from "./icons";

// The one lead form (R10): same fields and same route on every page.
// The browser's built-in checks (required, type=email, pattern) catch typos;
// the server validates everything again and returns per-field messages.

type Props = {
  adSpendRanges: string[];
  interests: string[];
  careersLine: boolean;
  /** Pre-selects "Interested in" (e.g. on a service page). */
  defaultInterest?: string;
  title?: string;
};

const FIELD = "rm-field flex min-h-12 items-center px-4";
const INPUT = "h-12 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-fg-2/70";
const SELECT = "h-12 w-full bg-transparent text-base outline-none";

export function LeadForm({
  adSpendRanges,
  interests,
  careersLine,
  defaultInterest,
  title = "Tell us about your brand",
}: Props) {
  const id = useId();
  const started = useRef(0);
  const metaSent = useRef(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    started.current = Date.now();
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const input = {
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      businessType: get("businessType"),
      website: get("website"),
      adSpendRange: get("adSpendRange"),
      interest: get("interest"),
      message: get("message"),
      consent: f.get("consent") === "on",
      pagePath: window.location.pathname,
      attribution: Object.fromEntries(Object.entries(loadAttribution()).filter(([, v]) => v)),
      fax: get("fax"),
      startedAt: started.current || Date.now(),
    };
    setFields({});
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const out = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
      };
      if (res.ok && out.ok) {
        track("lead_submit", { form: "lead" });
        if (!metaSent.current) {
          metaSent.current = true;
          const eventId = generateEventId();
          trackMetaConversion(META_CONVERSION_SEND_ENQUIRY, eventId);
          pushDataLayer("send_enquiry_success", { event_id: eventId });
        }
        setDone(input.name.trim().split(" ")[0]);
        return;
      }
      if (out.fields) setFields(out.fields);
      setError(
        out.error === "too_many"
          ? "You’ve sent a few requests already. Please wait a few minutes, or message us on WhatsApp."
          : "Something went wrong. Please try again, or message us on WhatsApp.",
      );
    } catch {
      setError("You seem to be offline. Please try again, or message us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col items-start gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand text-brand-fg">
          <CheckIcon size={24} />
        </span>
        <h2 className="text-2xl font-bold tracking-[-0.02em]">Thanks, {done}!</h2>
        <p className="text-fg-2">We’ve got your details and will get back to you soon.</p>
      </div>
    );
  }

  const err = (k: string) =>
    fields[k] ? (
      <span id={`${id}-${k}-err`} className="text-sm font-normal text-danger">
        {fields[k]}
      </span>
    ) : null;
  const aria = (k: string) =>
    fields[k] ? { "aria-invalid": true as const, "aria-describedby": `${id}-${k}-err` } : {};

  return (
    <form onSubmit={submit} className="relative flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-[-0.02em]">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name *
          <span className={FIELD}>
            <input name="name" autoComplete="name" required className={INPUT} {...aria("name")} />
          </span>
          {err("name")}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Phone / WhatsApp *
          <span className={FIELD}>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              placeholder="+91 …"
              pattern="\+?[0-9][0-9 \-]{5,22}"
              title="Phone number with country code, e.g. +91 98765 43210"
              className={INPUT}
              {...aria("phone")}
            />
          </span>
          {err("phone")}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email *
          <span className={FIELD}>
            <input name="email" type="email" autoComplete="email" required className={INPUT} {...aria("email")} />
          </span>
          {err("email")}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Business type
          <span className={FIELD}>
            <input name="businessType" placeholder="e.g. fashion brand" className={INPUT} />
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Website
          <span className={FIELD}>
            <input name="website" type="url" inputMode="url" placeholder="https://" className={INPUT} />
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Monthly ad spend
          <span className={FIELD}>
            <select name="adSpendRange" defaultValue="" className={SELECT}>
              <option value="">Choose one</option>
              {adSpendRanges.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
          Interested in
          <span className={FIELD}>
            <select name="interest" defaultValue={defaultInterest ?? ""} className={SELECT}>
              <option value="">Choose one</option>
              {interests.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
          Message (optional)
          <span className="rm-field flex px-4 py-3">
            <textarea
              name="message"
              rows={3}
              maxLength={2000}
              className="w-full resize-y bg-transparent text-base outline-none"
            />
          </span>
        </label>
      </div>

      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Fax
          <input name="fax" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm text-fg-2">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
          {...aria("consent")}
        />
        <span>
          {CONSENT_TEXT.replace(" Privacy Notice.", "")}{" "}
          <Link href="/privacy" className="font-medium text-fg underline underline-offset-2">
            Privacy Notice
          </Link>
          .
        </span>
      </label>
      {err("consent")}

      {error && (
        <p role="alert" className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rm-press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-fg disabled:opacity-60 max-sm:h-14 max-sm:w-full max-sm:text-lg"
      >
        {busy ? "Sending…" : "Send my enquiry"}
        {!busy && <ArrowRightIcon size={18} />}
      </button>

      {careersLine && (
        <p className="text-sm text-fg-2">
          Looking for a job?{" "}
          <Link href="/careers" className="font-medium text-fg underline underline-offset-2">
            See Careers
          </Link>
        </p>
      )}
    </form>
  );
}
