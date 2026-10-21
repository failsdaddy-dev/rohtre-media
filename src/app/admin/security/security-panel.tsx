"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

// Change your own password (simple email + password sign-in, no 2FA).

export function SecurityPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [show, setShow] = useState(false);

  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    const form = new FormData(el);
    const password = String(form.get("password") ?? "");
    if (password.length < 12) return setMessage({ ok: false, text: "Use at least 12 characters." });
    if (password !== String(form.get("confirm") ?? ""))
      return setMessage({ ok: false, text: "The two passwords don’t match." });
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (!error) el.reset();
    setMessage(
      error
        ? { ok: false, text: "Couldn’t change the password. Try a different one." }
        : { ok: true, text: "Password changed." },
    );
  };

  return (
    <div className="max-w-xl">
      <Panel title="Change password">
        <p className="-mt-2 mb-5 text-sm text-fg-2">
          Choose a new password for your sign-in. You stay signed in on this device.
        </p>
        <form onSubmit={changePassword} className="flex flex-col gap-4">
          <Field label="New password" hint="At least 12 characters.">
            <input
              name="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Repeat new password">
            <input
              name="confirm"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              className={INPUT_CLASS}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
              className="size-4 accent-[var(--brand)]"
            />
            Show passwords
          </label>
          {message && (
            <p
              role="status"
              className={`rounded-xl px-3 py-2 text-sm ${
                message.ok ? "bg-chip" : "bg-[color-mix(in_srgb,var(--danger)_15%,transparent)]"
              }`}
            >
              {message.text}
            </p>
          )}
          <div className="flex justify-end border-t border-line pt-4">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Saving…" : "Change password"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
