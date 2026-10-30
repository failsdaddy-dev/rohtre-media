"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ContactContent } from "@/content/contact-schema";
import { loadAttribution } from "@/lib/attribution";
import { CONTACT_CONSENT_TEXT, enquirySchema, MESSAGE_MAX } from "@/lib/contact-enquiry";
import { pushDataLayer } from "@/lib/data-layer";
import { generateEventId, META_CONVERSION_SEND_ENQUIRY, trackMetaConversion } from "@/lib/meta-pixel";
import { track } from "@/lib/track";
import { Select } from "../admin/select";
import { DIAL_OPTIONS } from "../country-flag";
import { ArrowRightIcon, ChatIcon, ServiceIcon } from "../icons";
import { MultiSelect } from "./multi-select";

// The Contact page form, in a white sharp-cornered card (design.css,
// .rm-contact-card). Same field look as the careers form (.rm-apply-field).
// Checks run here for instant, plain-word errors and again on the server
// (/api/contact). Errors sit in the gap under each field (absolute), so
// nothing jumps. The existing lead conversion event (lead_submit) fires only after
// the server confirms the enquiry was received. Dropdowns are the careers
// form's (inline Select); "Interested in" is a matching multi-choice dropdown. On phones the submit button
// leaves room on the right for the floating WhatsApp button.

const LABEL = "relative flex flex-col gap-2 text-[13px] font-semibold tracking-[0.01em] text-[#2a2f3a]";
const INPUT = "h-[44px] sm:h-[46px] w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-[#8a93a3]";
const OPTIONAL = <span className="font-normal text-[#8a93a3]">(optional)</span>;
const REQUIRED = (
  <span aria-hidden="true" className="text-brand">
    *
  </span>
);

type Errors = Record<string, string>;
type State = "idle" | "loading" | "success" | "error";

function Field({ icon, children, className = "" }: { icon?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`rm-apply-field ${className}`}>
      {icon && <ServiceIcon name={icon} size={18} className="shrink-0 text-[#8a93a3]" />}
      {children}
    </span>
  );
}

export function ContactForm({ form, whatsappHref }: { form: ContactContent["form"]; whatsappHref: string | null }) {
  const started = useRef(0);
  const metaSent = useRef(false);
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [dialCode, setDialCode] = useState("+91");
  const [businessType, setBusinessType] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [chars, setChars] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    started.current = Date.now();
  }, []);

  const aria = (k: string) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `contact-${k}-err` : undefined,
  });
  /** A fixed-height slot under each field, so an error never pushes the layout. */
  const err = (k: string) => (
    <span id={`contact-${k}-err`} className="rm-contact-err" aria-live="polite">
      {errors[k] ?? ""}
    </span>
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const input = {
      fullName: get("fullName"),
      dialCode,
      phone: get("phone"),
      email: get("email"),
      businessType,
      website: get("website"),
      adSpend,
      interests: picked,
      message: get("message"),
      consent: f.get("consent") === "on",
      fax: get("fax"),
      startedAt: started.current || Date.now(),
      attribution: Object.fromEntries(Object.entries(loadAttribution()).filter(([, v]) => v)) as Record<string, string>,
    };
    const next: Errors = {};
    const parsed = enquirySchema.safeParse(input);
    if (!parsed.success) for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
    setErrors(next);
    setError(null);
    if (Object.keys(next).length) {
      e.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Errors };
      if (res.ok && body.ok) {
        // The site's existing conversion event, unchanged: only after a confirmed submission.
        track("lead_submit", { form: "lead" });
        if (!metaSent.current) {
          metaSent.current = true;
          const eventId = generateEventId();
          trackMetaConversion(META_CONVERSION_SEND_ENQUIRY, eventId);
          pushDataLayer("send_enquiry_success", { event_id: eventId });
        }
        setName(input.fullName.trim().split(/\s+/)[0] ?? "");
        setState("success");
        return;
      }
      setState("error");
      if (body.error === "invalid") {
        setErrors(body.fields ?? {});
        setError("Please check the highlighted fields.");
      } else if (body.error === "too_many")
        setError("You’ve sent a few enquiries already. Please wait a few minutes, or message us on WhatsApp.");
      else setError("Something went wrong and your enquiry was not sent. Please try again, or message us on WhatsApp.");
    } catch {
      setState("error");
      setError("You seem to be offline. Please check your connection and try again.");
    }
  }

  if (state === "success") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-10 text-center sm:py-14">
        <span className="rm-contact-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" pathLength={1} />
          </svg>
        </span>
        <h2 className="mt-2 text-[1.75rem] font-bold tracking-[-0.03em]">
          {form.thanksTitle}
          {name && <span className="sr-only">, {name}</span>}
        </h2>
        <p className="max-w-md text-[16px] leading-relaxed text-[#4b5563]">{form.thanksText}</p>
        {whatsappHref && form.whatsappLabel && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            className="rm-press mt-2 inline-flex h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 font-semibold text-[#0b3d1f]"
          >
            <ChatIcon size={18} /> {form.whatsappLabel}
          </a>
        )}
      </div>
    );
  }

  const sending = state === "loading";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rm-contact-form relative flex flex-col gap-5"
      aria-labelledby="contact-form-title"
    >
      <header className="flex flex-col gap-1.5 border-b border-[#eef0f3] pb-4">
        <h2 id="contact-form-title" className="text-[1.4rem] font-bold leading-tight tracking-[-0.03em] sm:text-[1.65rem]">
          {form.title}
        </h2>
        <p className="text-[13.5px] leading-relaxed text-[#5b6472]">
          {form.qualifier}{" "}
          {form.qualifier && form.qualifierLinkLabel && (
            <Link href={form.qualifierHref} className="font-semibold text-brand underline underline-offset-2">
              {form.qualifierLinkLabel}
            </Link>
          )}
          <span className="max-sm:hidden">
            {form.qualifier ? " · " : ""}
            Fields marked {REQUIRED} are required.
          </span>
        </p>
      </header>

      {/* Two columns from 640 px. Errors sit in the row gap, so nothing moves when one appears. */}
      <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
        <label className={LABEL}>
          <span>Full name {REQUIRED}</span>
          <Field icon="users">
            <input name="fullName" autoComplete="name" placeholder="Your full name" aria-required="true" className={INPUT} {...aria("fullName")} />
          </Field>
          {err("fullName")}
        </label>
        <label className={LABEL}>
          <span>Email {REQUIRED}</span>
          <Field icon="globe">
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@yourbrand.com"
              aria-required="true"
              className={INPUT}
              {...aria("email")}
            />
          </Field>
          {err("email")}
        </label>
        <div className={LABEL}>
          <label htmlFor="contact-phone">WhatsApp / phone {REQUIRED}</label>
          <div className="flex gap-2">
            <span className="rm-apply-select w-[8.5rem] shrink-0">
              <Select
                inline
                name="dialCode"
                value={dialCode}
                onChange={setDialCode}
                aria-label="Country code"
                popupClassName="left-0 w-72 max-w-[calc(100vw-3.5rem)]"
                options={DIAL_OPTIONS}
              />
            </span>
            <Field className="min-w-0 flex-1">
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                aria-required="true"
                className={INPUT}
                {...aria("phone")}
              />
            </Field>
          </div>
          {err("phone")}
        </div>
        <label className={LABEL}>
          <span>Website {OPTIONAL}</span>
          <Field icon="network">
            <input name="website" inputMode="url" autoComplete="url" placeholder="yourbrand.com" className={INPUT} {...aria("website")} />
          </Field>
          {err("website")}
        </label>
        <div className={LABEL}>
          <span>Business type {OPTIONAL}</span>
          <span className="rm-apply-select">
            <Select
              inline
              name="businessType"
              value={businessType}
              onChange={setBusinessType}
              invalid={Boolean(errors.businessType)}
              placeholder="Choose one"
              aria-label="Business type"
              options={form.businessTypes.map((x) => ({ value: x, label: x }))}
            />
          </span>
          {err("businessType")}
        </div>
        <div className={LABEL}>
          <span>Monthly ad spend {OPTIONAL}</span>
          <span className="rm-apply-select">
            <Select
              inline
              name="adSpend"
              value={adSpend}
              onChange={setAdSpend}
              invalid={Boolean(errors.adSpend)}
              placeholder="Choose one"
              aria-label="Monthly ad spend"
              options={form.adSpend.map((x) => ({ value: x, label: x }))}
            />
          </span>
          {err("adSpend")}
        </div>

        <div className={`${LABEL} sm:col-span-2`}>
          <span>Interested in {OPTIONAL}</span>
          <span className="rm-apply-select">
            <MultiSelect
              value={picked}
              onChange={setPicked}
              options={form.interests}
              invalid={Boolean(errors.interests)}
              placeholder="Choose one or more services"
              aria-label="Interested in"
            />
          </span>
          {err("interests")}
        </div>

        <label className={`${LABEL} sm:col-span-2`}>
          <span className="flex items-baseline justify-between gap-3">
            <span>Message {OPTIONAL}</span>
            <span className={`text-[12px] font-normal tabular-nums ${chars > MESSAGE_MAX ? "text-danger" : "text-[#8a93a3]"}`}>
              {chars}/{MESSAGE_MAX}
            </span>
          </span>
          <span className="rm-apply-field items-stretch p-0!">
            <textarea
              name="message"
              rows={3}
              maxLength={MESSAGE_MAX}
              onChange={(e) => setChars(e.target.value.length)}
              placeholder="Your goals, timeline or anything else we should know"
              className="min-h-[92px] w-full resize-none rounded-[10px] bg-transparent px-[14px] py-[12px] text-[15px] leading-[1.55] outline-none placeholder:text-[#8a93a3]"
              {...aria("message")}
            />
          </span>
          {err("message")}
        </label>
      </div>

      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Fax
          <input name="fax" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="relative mt-1">
        <label className="rm-apply-consent">
          <input
            name="consent"
            type="checkbox"
            aria-required="true"
            className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
            {...aria("consent")}
          />
          <span>
            {CONTACT_CONSENT_TEXT} {REQUIRED}{" "}
            <Link href="/privacy" className="font-semibold text-[#1f2430] underline underline-offset-2">
              Privacy Notice
            </Link>
          </span>
        </label>
        {err("consent")}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-2 rounded-2xl bg-[color-mix(in_srgb,var(--danger)_12%,white)] px-4 py-3 text-sm font-medium text-[#8a1018]"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={sending} aria-busy={sending} className="rm-apply-submit rm-contact-submit mt-3">
        {sending ? (
          <>
            <span aria-hidden="true" className="rm-apply-spinner" /> Sending…
          </>
        ) : (
          <>
            {state === "error" ? "Try again" : form.submitLabel} <ArrowRightIcon size={20} />
          </>
        )}
      </button>
    </form>
  );
}
