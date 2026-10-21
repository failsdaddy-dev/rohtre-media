"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

// Authenticator-app (TOTP) set-up and sign-in confirmation, using Supabase
// Auth MFA from the browser (free, on by default).
// verified: https://supabase.com/docs/guides/auth/auth-mfa/totp

type FactorRow = { id: string; friendly_name?: string; status: string; created_at: string };
type Enrolment = { id: string; qr: string; secret: string };

const CODE = /^\d{6}$/;
const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export function SecurityPanel({ required, aal }: { required: boolean; aal: "aal1" | "aal2" }) {
  const router = useRouter();
  const [factors, setFactors] = useState<FactorRow[] | null>(null);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);

  const fetchFactors = async () => {
    const { data } = await supabaseBrowser().auth.mfa.listFactors();
    return (data?.all ?? []).filter((f) => f.factor_type === "totp") as FactorRow[];
  };
  const load = async () => setFactors(await fetchFactors());
  useEffect(() => {
    let live = true;
    void fetchFactors().then((list) => live && setFactors(list));
    return () => {
      live = false;
    };
  }, []);

  const verified = factors?.filter((f) => f.status === "verified") ?? [];

  const confirm = async (factorId: string, done: string) => {
    if (!CODE.test(code)) return setMessage("Enter the 6-digit code from your app.");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    setCode("");
    if (error) return setMessage("That code didn’t work. Check the time on your phone and try the next code.");
    setEnrolment(null);
    setMessage(done);
    await load();
    router.refresh(); // the server now sees the AAL2 session
  };

  const startEnrol = async () => {
    setBusy(true);
    setMessage(null);
    const sb = supabaseBrowser();
    // Drop half-finished set-ups first; Supabase limits unverified factors.
    for (const f of factors ?? []) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)} ${Math.floor(Date.now() / 1000) % 10000}`,
    });
    setBusy(false);
    if (error || !data) return setMessage("Couldn’t start set-up. Please try again.");
    setEnrolment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const remove = async (factorId: string) => {
    setBusy(true);
    const { error } = await supabaseBrowser().auth.mfa.unenroll({ factorId });
    setBusy(false);
    setMessage(error ? "Couldn’t remove it. Confirm your code first, then try again." : "Authenticator removed.");
    await load();
    router.refresh();
  };

  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    const form = new FormData(el);
    const password = String(form.get("password") ?? "");
    if (password.length < 12) return setMessage("Use at least 12 characters.");
    if (password !== String(form.get("confirm") ?? "")) return setMessage("The two passwords don’t match.");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (!error) el.reset();
    setMessage(error ? "Couldn’t change the password. Try a different one." : "Password changed.");
  };

  const codeInput = (
    <Field label="6-digit code">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        className={`${INPUT_CLASS} max-w-[200px] font-mono tracking-[0.3em]`}
      />
    </Field>
  );

  return (
    <div className="flex flex-col gap-6">
      {required && (
        <p role="alert" className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-4 py-3 text-sm">
          The owner and developer need two-factor sign-in before using the admin.{" "}
          {verified.length ? "Enter the code from your authenticator app." : "Set up an authenticator app below."}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      )}

      <Panel title="Two-factor sign-in">
        {factors === null ? (
          <p className="text-fg-2">Loading…</p>
        ) : verified.length > 0 && aal !== "aal2" ? (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void confirm(verified[0].id, "Confirmed. You can use the admin now.");
            }}
          >
            {codeInput}
            <Button type="submit" variant="primary" disabled={busy}>
              Confirm
            </Button>
          </form>
        ) : enrolment ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              1. Open Google Authenticator, Microsoft Authenticator, 1Password or a similar app and scan this code.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG data URL from Supabase */}
            <img
              src={enrolment.qr}
              alt="QR code for your authenticator app"
              className="size-48 rounded-xl bg-white p-2"
            />
            <p className="text-sm text-fg-2">
              Can’t scan? Enter this key by hand: <code className="break-all font-mono">{enrolment.secret}</code>
            </p>
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void confirm(enrolment.id, "Two-factor sign-in is on.");
              }}
            >
              {codeInput}
              <Button type="submit" variant="primary" disabled={busy}>
                2. Confirm code
              </Button>
              <Button onClick={() => setEnrolment(null)} variant="ghost">
                Cancel
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {verified.length === 0 ? (
              <p className="text-fg-2">Not set up yet. You’ll need an authenticator app on your phone.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {verified.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      {f.friendly_name ?? "Authenticator app"}{" "}
                      <span className="text-fg-2">· added {fmt.format(new Date(f.created_at))}</span>
                    </span>
                    <Button
                      className="h-8 text-xs"
                      variant={armed === f.id ? "danger" : "ghost"}
                      disabled={busy}
                      onClick={() => {
                        if (armed !== f.id) return setArmed(f.id);
                        setArmed(null);
                        void remove(f.id);
                      }}
                    >
                      {armed === f.id ? "Click again to remove" : "Remove"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <Button variant="primary" onClick={() => void startEnrol()} disabled={busy}>
                {verified.length ? "Add another device" : "Set up authenticator app"}
              </Button>
            </div>
            <p className="text-xs text-fg-2">
              Lost your phone? The owner can reset your two-factor sign-in from the Users page.
            </p>
          </div>
        )}
      </Panel>

      {!required && (
        <Panel title="Change password">
          <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Field label="New password" hint="At least 12 characters.">
              <input name="password" type="password" autoComplete="new-password" className={INPUT_CLASS} />
            </Field>
            <Field label="Repeat new password">
              <input name="confirm" type="password" autoComplete="new-password" className={INPUT_CLASS} />
            </Field>
            <Button type="submit" variant="primary" disabled={busy}>
              Change password
            </Button>
          </form>
        </Panel>
      )}
    </div>
  );
}
