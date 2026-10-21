"use client";

// Email + password sign-in (R22, R44). No public sign-up: staff accounts are
// created by the owner. Someone already signed in is sent straight on.

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "@/components/icons";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { safeNext } from "@/lib/safe-next";
import { supabaseBrowser } from "@/lib/supabase/client";

const FIELD = "rm-field flex h-12 items-center gap-3 px-4 font-normal";
const INPUT = "h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-fg-2/60";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(SUPABASE_CONFIGURED);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    let live = true;
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (!live) return;
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else setChecking(false);
      });
    return () => {
      live = false;
    };
  }, [next, router]);

  const signIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!SUPABASE_CONFIGURED) {
      setError("Supabase isn’t configured on this computer (.env.local).");
      return;
    }
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    if (error) {
      setBusy(false);
      setError("That email and password don’t match an active account.");
      return;
    }
    router.replace(next);
    router.refresh();
  };

  if (checking) return null;

  return (
    <form onSubmit={signIn} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Sign in to the admin</h2>
        <p className="mt-1 text-sm text-fg-2">Use the email and password the site owner gave you.</p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <span className={FIELD}>
          <MailIcon size={18} className="shrink-0 text-fg-2" />
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            placeholder="you@rohtremedia.com"
            className={INPUT}
          />
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <span className={FIELD}>
          <LockIcon size={18} className="shrink-0 text-fg-2" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••"
            className={INPUT}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="-mr-2 grid size-8 shrink-0 place-items-center rounded-full text-fg-2 transition-colors hover:bg-hover hover:text-fg"
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rm-press mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand font-semibold text-brand-fg disabled:opacity-60"
      >
        {busy ? "Checking…" : "Sign in"}
        {!busy && <ArrowRightIcon size={18} />}
      </button>
      <p className="border-t border-line pt-4 text-xs leading-5 text-fg-2">
        Forgot your password or lost access? Ask the site owner.
      </p>
    </form>
  );
}
