"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

// Change your own password (simple email + password sign-in, no 2FA).

export function SecurityPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      )}
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
    </div>
  );
}
