"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CAREER_CATEGORIES } from "@/content/careers-schema";
import {
  applicationSchema,
  CONSENT_TEXT,
  DIAL_CODES,
  OTHER_ROLE,
  RESUME_MAX_BYTES,
  RESUME_TYPES,
} from "@/lib/career-application";
import { Select } from "../admin/select";
import { ArrowRightIcon, ServiceIcon } from "../icons";

// The careers application form, in a modal dialog: a clean white panel
// with red accents and slightly rounded corners (design.css, .rm-apply*),
// a short pop-in (a bottom sheet that slides up on phones) and a matching
// close. It scrolls inside itself with the scrollbar hidden. Any link to
// "#apply" on the page opens it (hero button, block links, the closing
// card). The native <dialog> (showModal) keeps keyboard focus inside and
// returns it to the opener; Escape and a click outside close it. Checks run
// here for instant errors and again on the server. No tracking event is fired.

const LABEL = "flex flex-col gap-2 text-[13px] font-semibold tracking-[0.01em] text-[#2a2f3a]";
const INPUT = "h-[52px] w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-[#8a93a3]";
const CLOSE_MS = 260;

type Errors = Record<string, string>;

/** A field box: optional leading icon, then the control. Dropdowns use the site's shared Select. */
function Field({ icon, children, className = "" }: { icon?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`rm-apply-field ${className}`}>
      {icon && <ServiceIcon name={icon} size={18} className="shrink-0 text-[#8a93a3]" />}
      {children}
    </span>
  );
}

export function ApplyDialog({
  roles,
  experience,
  success,
}: {
  roles: string[];
  experience: string[];
  success: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [role, setRole] = useState("");
  const [dialCode, setDialCode] = useState("+91");
  const [exp, setExp] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const open = () => {
    const d = dialog.current;
    if (!d || d.open) return;
    opener.current = document.activeElement as HTMLElement | null;
    d.removeAttribute("data-closing");
    d.showModal();
  };
  /** Plays the closing animation, then closes (instantly for reduced motion). */
  const close = () => {
    const d = dialog.current;
    if (!d?.open || d.hasAttribute("data-closing")) return;
    if (!document.documentElement.hasAttribute("data-motion")) return d.close();
    d.setAttribute("data-closing", "");
    window.setTimeout(() => {
      d.removeAttribute("data-closing");
      d.close();
    }, CLOSE_MS);
  };

  // Links to #apply open the form; so does arriving at /careers#apply.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href="#apply"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation(); // the smooth-scroll script would look for an #apply target
      open();
    };
    document.addEventListener("click", onClick, true);
    if (location.hash === "#apply") open();
    const d = dialog.current;
    const onClose = () => opener.current?.focus?.();
    // Escape: animate the close instead of the browser's instant one.
    const onCancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    d?.addEventListener("close", onClose);
    d?.addEventListener("cancel", onCancel);
    return () => {
      document.removeEventListener("click", onClick, true);
      d?.removeEventListener("close", onClose);
      d?.removeEventListener("cancel", onCancel);
    };
  }, []);

  const aria = (k: string) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `apply-${k}-err` : undefined,
  });
  const err = (k: string) =>
    errors[k] ? (
      <span id={`apply-${k}-err`} className="text-[13px] font-medium text-danger">
        {errors[k]}
      </span>
    ) : null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next: Errors = {};
    const parsed = applicationSchema.safeParse({
      category: f.get("category") ?? undefined,
      fullName: String(f.get("fullName") ?? ""),
      email: String(f.get("email") ?? ""),
      dialCode: String(f.get("dialCode") ?? ""),
      phone: String(f.get("phone") ?? ""),
      role: String(f.get("role") ?? ""),
      otherRole: String(f.get("otherRole") ?? "") || undefined,
      experience: String(f.get("experience") ?? ""),
      portfolio: String(f.get("portfolio") ?? ""),
      message: String(f.get("message") ?? ""),
      consent: f.get("consent") === "on",
    });
    if (!parsed.success) for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
    const file = f.get("resume");
    if (file instanceof File && file.size > 0) {
      if (file.size > RESUME_MAX_BYTES) next.resume = "The resume must be 4 MB or smaller.";
      else if (!RESUME_TYPES[file.type]) next.resume = "Upload a PDF, DOC or DOCX file.";
    }
    setErrors(next);
    setError(null);
    if (Object.keys(next).length) {
      const first = e.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/careers", { method: "POST", body: f });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Errors };
      if (res.ok && body.ok) setDone(true);
      else if (body.error === "invalid") {
        setErrors(body.fields ?? {});
        setError("Please check the highlighted fields.");
      } else if (body.error === "too_many")
        setError("Too many applications from this connection. Please try again in a few minutes.");
      else setError("Something went wrong and your application was not sent. Please try again, or use Chat with HR.");
    } catch {
      setError("You seem to be offline. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="apply-title"
      onClick={(e) => e.target === dialog.current && close()}
      className="rm-apply"
      // The smooth-scroll script must let the form scroll on its own.
      data-lenis-prevent=""
    >
      <div className="relative p-5 pt-6 sm:p-9">
        <span aria-hidden="true" className="rm-apply-grabber" />
        {/* Zero-height sticky bar: the close button stays in view while the form scrolls. */}
        <div className="sticky top-4 z-20 -mt-5 mb-5 h-0 max-sm:top-3 max-sm:-mt-3 max-sm:mb-3">
          <button type="button" onClick={close} aria-label="Close" className="rm-apply-close">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {done ? (
          <div role="status" className="flex flex-col items-center gap-4 px-2 py-10 text-center">
            <span className="rm-apply-check" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                className="size-9"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            <h2 id="apply-title" className="mt-2 text-[1.75rem] font-bold tracking-[-0.03em]">
              Application received
            </h2>
            <p className="max-w-sm text-[16px] leading-relaxed text-[#4b5563]">{success}</p>
            <button type="button" onClick={close} className="rm-apply-ghost mt-3">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <header className="flex items-center gap-4 pr-12 max-sm:gap-3">
              <span aria-hidden="true" className="rm-apply-badge max-sm:size-10! max-sm:rounded-[10px]!">
                <ServiceIcon name="briefcase" size={22} className="max-sm:size-[18px]" />
              </span>
              <div className="min-w-0">
                <h2
                  id="apply-title"
                  className="whitespace-nowrap text-[1.6rem] font-bold leading-tight tracking-[-0.03em] max-sm:text-[1.2rem] sm:text-[1.85rem]"
                >
                  Apply to RohTre Media
                </h2>
                <p className="mt-1 text-sm text-[#5b6472] max-sm:mt-0.5 max-sm:text-[12.5px]">Tell us about you. It takes about 2 minutes.</p>
              </div>
            </header>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] font-semibold text-[#2a2f3a]">I’m applying for</legend>
              <div className="rm-seg-track" role="radiogroup" aria-label="I’m applying for">
                <span aria-hidden="true" className="rm-seg-thumb" />
                {CAREER_CATEGORIES.map((c, i) => (
                  <label key={c} className="relative z-[1] cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      className="peer sr-only"
                      {...(i === 0 ? aria("category") : {})}
                    />
                    <span className="rm-seg-label">{c}</span>
                  </label>
                ))}
              </div>
              {err("category")}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={LABEL}>
                Full name
                <Field icon="users">
                  <input
                    name="fullName"
                    autoComplete="name"
                    placeholder="Your full name"
                    required
                    className={INPUT}
                    {...aria("fullName")}
                  />
                </Field>
                {err("fullName")}
              </label>
              <label className={LABEL}>
                Email
                <Field icon="globe">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    className={INPUT}
                    {...aria("email")}
                  />
                </Field>
                {err("email")}
              </label>
              <div className={`${LABEL} sm:col-span-2`}>
                <label htmlFor="apply-phone">Phone / WhatsApp number</label>
                <div className="flex gap-2.5">
                  <span className="rm-apply-select w-[7.6rem] shrink-0">
                    <Select
                      inline
                      name="dialCode"
                      value={dialCode}
                      onChange={setDialCode}
                      aria-label="Country code"
                      options={DIAL_CODES.map((d) => ({ value: d.code, label: d.label }))}
                    />
                  </span>
                  <Field className="min-w-0 flex-1">
                    <input
                      id="apply-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="98765 43210"
                      required
                      className={INPUT}
                      {...aria("phone")}
                    />
                  </Field>
                </div>
                {err("phone")}
              </div>
              <div className={LABEL}>
                Role you’re applying for
                <span className="rm-apply-select">
                  <Select
                    inline
                    name="role"
                    value={role}
                    onChange={setRole}
                    required
                    invalid={Boolean(errors.role)}
                    placeholder="Choose a role"
                    aria-label="Role you’re applying for"
                    options={[...roles, OTHER_ROLE].map((r) => ({ value: r, label: r }))}
                  />
                </span>
                {err("role")}
              </div>
              <div className={LABEL}>
                Experience in this role
                <span className="rm-apply-select">
                  <Select
                    inline
                    name="experience"
                    value={exp}
                    onChange={setExp}
                    required
                    invalid={Boolean(errors.experience)}
                    placeholder="Choose"
                    aria-label="Experience in this role"
                    options={experience.map((x) => ({ value: x, label: x }))}
                  />
                </span>
                {err("experience")}
              </div>
              {role === OTHER_ROLE && (
                <label className={`${LABEL} sm:col-span-2`}>
                  Which role?
                  <Field>
                    <input
                      name="otherRole"
                      maxLength={60}
                      placeholder="e.g. Copywriter"
                      className={INPUT}
                      {...aria("otherRole")}
                    />
                  </Field>
                  {err("otherRole")}
                </label>
              )}
              <label className={`${LABEL} sm:col-span-2`}>
                <span>
                  Portfolio or LinkedIn <span className="font-normal text-[#8a93a3]">(optional)</span>
                </span>
                <Field icon="network">
                  <input
                    name="portfolio"
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    className={INPUT}
                    {...aria("portfolio")}
                  />
                </Field>
                {err("portfolio")}
              </label>
              <label className={`${LABEL} sm:col-span-2`}>
                <span>
                  Short message <span className="font-normal text-[#8a93a3]">(optional)</span>
                </span>
                <span className="rm-apply-field items-start py-3">
                  <textarea
                    name="message"
                    rows={3}
                    maxLength={1500}
                    placeholder="Anything you’d like us to know"
                    className="w-full resize-y bg-transparent text-[15px] outline-none placeholder:text-[#8a93a3]"
                  />
                </span>
              </label>
              <div className={`${LABEL} sm:col-span-2`}>
                <span>
                  Resume <span className="font-normal text-[#8a93a3]">(optional)</span>
                </span>
                <label className={`rm-apply-drop ${fileName ? "is-filled" : ""}`}>
                  <input
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                    {...aria("resume")}
                  />
                  <span aria-hidden="true" className="rm-apply-drop-icon">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {fileName ? (
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      ) : (
                        <path d="M12 16V4m0 0-4 4m4-4 4 4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
                      )}
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-[#1f2430]">
                      {fileName ?? "Upload your resume"}
                    </span>
                    <span className="block text-[12px] font-normal text-[#6b7280]">
                      {fileName ? "Tap to change" : "PDF or Word, up to 4 MB. Sent to HR with your application."}
                    </span>
                  </span>
                </label>
                {err("resume")}
              </div>
            </div>

            {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Fax
                <input name="fax" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <label className="rm-apply-consent">
              <input
                name="consent"
                type="checkbox"
                required
                className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
                {...aria("consent")}
              />
              <span>
                {CONSENT_TEXT}{" "}
                <Link href="/privacy" className="font-semibold text-[#1f2430] underline underline-offset-2">
                  Privacy Notice
                </Link>
              </span>
            </label>
            {err("consent")}

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-[color-mix(in_srgb,var(--danger)_12%,white)] px-4 py-3 text-sm font-medium text-[#8a1018]"
              >
                {error}
              </p>
            )}

            {/* Phones: the button stays at the bottom of the sheet while scrolling. */}
            <div className="rm-apply-submit-bar">
              <button type="submit" disabled={sending} className="rm-apply-submit w-full">
                {sending ? (
                  <>
                    <span aria-hidden="true" className="rm-apply-spinner" /> Sending…
                  </>
                ) : (
                  <>
                    Submit application <ArrowRightIcon size={20} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
