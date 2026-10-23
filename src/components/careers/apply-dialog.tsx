"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CAREER_CATEGORIES } from "@/content/careers-schema";
import {
  applicationSchema,
  CONSENT_TEXT,
  DIAL_CODES,
  OTHER_ROLE,
  RESUME_MAX_BYTES,
  RESUME_TYPES,
} from "@/lib/career-application";
import { ArrowRightIcon } from "../icons";

// The careers application form, in a modal dialog. Any link to "#apply" on
// the page opens it (hero button, block links, the closing card). The
// native <dialog> (showModal) keeps keyboard focus inside, closes on
// Escape and returns focus to the button that opened it. Checks run here
// for instant errors and again on the server. No tracking event is fired.

const FIELD = "rm-field flex min-h-12 items-center px-4";
const INPUT = "h-12 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-fg-2/70";
const SELECT = "h-12 w-full min-w-0 bg-transparent text-base outline-none";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

type Errors = Record<string, string>;

export function ApplyDialog({ roles, experience, success }: { roles: string[]; experience: string[]; success: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [role, setRole] = useState("");

  const open = () => {
    opener.current = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  // Links to #apply open the form; so does arriving at /careers#apply.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href="#apply"]');
      if (!a) return;
      e.preventDefault();
      open();
    };
    document.addEventListener("click", onClick);
    if (location.hash === "#apply") open();
    const d = dialog.current;
    const onClose = () => opener.current?.focus?.();
    d?.addEventListener("close", onClose);
    return () => {
      document.removeEventListener("click", onClick);
      d?.removeEventListener("close", onClose);
    };
  }, []);

  const aria = (k: string) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `apply-${k}-err` : undefined,
  });
  const err = (k: string) =>
    errors[k] ? (
      <span id={`apply-${k}-err`} className="text-sm font-normal text-danger">
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
      } else if (body.error === "too_many") setError("Too many applications from this connection. Please try again in a few minutes.");
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
      className="rm-apply m-auto max-h-[calc(100dvh-24px)] w-[min(680px,calc(100vw-24px))] overflow-y-auto overscroll-contain bg-bg-elev p-0 text-fg shadow-[0_40px_120px_-30px_rgba(0,0,0,0.5)] backdrop:bg-black/60"
    >
      <div className="relative p-5 sm:p-8">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-2xl leading-none hover:bg-hover"
        >
          ×
        </button>
        {done ? (
          <div role="status" className="flex flex-col items-start gap-4 py-6 pr-8">
            <span className="grid size-12 place-items-center bg-brand text-2xl text-brand-fg">✓</span>
            <h2 id="apply-title" className="text-2xl font-bold tracking-[-0.02em]">
              Application received
            </h2>
            <p className="text-lg text-fg-2">{success}</p>
            <button type="button" onClick={close} className="rm-press mt-2 h-12 rounded-full bg-chip px-6 font-semibold hover:bg-chip-hover">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <div className="pr-10">
              <p className="rm-label">Careers</p>
              <h2 id="apply-title" className="mt-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                Apply to RohTre Media
              </h2>
            </div>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">I’m applying for</legend>
              <div className="grid grid-cols-2 border border-line p-1" {...aria("category")}>
                {CAREER_CATEGORIES.map((c) => (
                  <label key={c} className="rm-seg relative cursor-pointer">
                    <input type="radio" name="category" value={c} className="peer sr-only" />
                    <span className="flex h-11 items-center justify-center text-sm font-semibold transition-colors peer-checked:bg-brand peer-checked:text-brand-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                      {c}
                    </span>
                  </label>
                ))}
              </div>
              {err("category")}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={LABEL}>
                Full name
                <span className={FIELD}>
                  <input name="fullName" autoComplete="name" required className={INPUT} {...aria("fullName")} />
                </span>
                {err("fullName")}
              </label>
              <label className={LABEL}>
                Email
                <span className={FIELD}>
                  <input name="email" type="email" autoComplete="email" required className={INPUT} {...aria("email")} />
                </span>
                {err("email")}
              </label>
              <div className={`${LABEL} sm:col-span-2`}>
                <label htmlFor="apply-phone">Phone / WhatsApp number</label>
                <div className="flex gap-2">
                  <span className={`${FIELD} w-[9.5rem] shrink-0`}>
                    <select name="dialCode" defaultValue="+91" aria-label="Country code" className={SELECT}>
                      {DIAL_CODES.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className={`${FIELD} min-w-0 flex-1`}>
                    <input
                      id="apply-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      required
                      className={INPUT}
                      {...aria("phone")}
                    />
                  </span>
                </div>
                {err("phone")}
              </div>
              <label className={LABEL}>
                Role you’re applying for
                <span className={FIELD}>
                  <select
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className={SELECT}
                    {...aria("role")}
                  >
                    <option value="" disabled>
                      Choose a role
                    </option>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value={OTHER_ROLE}>Other</option>
                  </select>
                </span>
                {err("role")}
              </label>
              <label className={LABEL}>
                Experience in this role
                <span className={FIELD}>
                  <select name="experience" defaultValue="" required className={SELECT} {...aria("experience")}>
                    <option value="" disabled>
                      Choose
                    </option>
                    {experience.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </span>
                {err("experience")}
              </label>
              {role === OTHER_ROLE && (
                <label className={`${LABEL} sm:col-span-2`}>
                  Which role?
                  <span className={FIELD}>
                    <input name="otherRole" maxLength={60} className={INPUT} {...aria("otherRole")} />
                  </span>
                  {err("otherRole")}
                </label>
              )}
              <label className={`${LABEL} sm:col-span-2`}>
                Portfolio or LinkedIn link (optional)
                <span className={FIELD}>
                  <input name="portfolio" type="url" inputMode="url" placeholder="https://" className={INPUT} {...aria("portfolio")} />
                </span>
                {err("portfolio")}
              </label>
              <label className={`${LABEL} sm:col-span-2`}>
                Short message (optional)
                <span className="rm-field flex px-4 py-3">
                  <textarea name="message" rows={3} maxLength={1500} className="w-full resize-y bg-transparent text-base outline-none" />
                </span>
              </label>
              <label className={`${LABEL} sm:col-span-2`}>
                Resume (optional, PDF or Word, up to 4 MB)
                <span className={`${FIELD} py-2`}>
                  <input
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="w-full min-w-0 text-sm file:mr-3 file:h-9 file:cursor-pointer file:border-0 file:bg-chip file:px-4 file:font-semibold"
                    {...aria("resume")}
                  />
                </span>
                <span className="text-xs font-normal text-fg-2">Sent to our HR team with your application; not stored on the website.</span>
                {err("resume")}
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
              <input name="consent" type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" {...aria("consent")} />
              <span>
                {CONSENT_TEXT}{" "}
                <Link href="/privacy" className="font-medium text-fg underline underline-offset-2">
                  Privacy Notice
                </Link>
              </span>
            </label>
            {err("consent")}

            {error && (
              <p role="alert" className="bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="rm-press inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-brand px-8 text-lg font-semibold text-brand-fg disabled:opacity-60"
            >
              {sending ? "Sending…" : "Submit application"} {!sending && <ArrowRightIcon size={20} />}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
