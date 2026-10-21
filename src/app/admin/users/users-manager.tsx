"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Field, INPUT_CLASS, Panel } from "@/components/admin/ui";
import { createStaff, resetPassword, resetTwoFactor, updateStaff, type Result } from "./actions";

export type StaffRow = {
  userId: string;
  role: "owner" | "developer" | "editor";
  name: string | null;
  active: boolean;
  email: string | null;
  lastSignIn: string | null;
  twoFactor: boolean;
};

const ROLES = [
  { value: "editor", label: "Editor — edits drafts" },
  { value: "developer", label: "Developer — publishes, settings, leads" },
  { value: "owner", label: "Owner — everything, including users" },
] as const;

const SELECT = `${INPUT_CLASS} bg-transparent`;
const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

export function UsersManager({ rows, me }: { rows: StaffRow[]; me: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [draft, setDraft] = useState({ email: "", name: "", role: "editor" });

  const run = (fn: () => Promise<Result>, done: string, email?: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? done : (res.error ?? "Something went wrong."));
      setSecret(res.ok && res.tempPassword && email ? { email, password: res.tempPassword } : null);
      if (res.ok) {
        after?.();
        router.refresh();
      }
    });

  const confirmFirst = (key: string, action: () => void) => {
    if (armed !== key) return setArmed(key);
    setArmed(null);
    action();
  };

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      )}
      {secret && (
        <div className="rounded-2xl border border-brand p-4 text-sm">
          <p className="font-semibold">One-time password for {secret.email}</p>
          <p className="mt-2 break-all font-mono text-base">{secret.password}</p>
          <p className="mt-2 text-fg-2">
            Copy it now and send it to them privately. It isn’t shown again. They should change it on the Security page
            after signing in.
          </p>
          <Button className="mt-3" onClick={() => setSecret(null)}>
            Done, hide it
          </Button>
        </div>
      )}

      <Panel title="Add a person">
        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => createStaff(draft),
              "Account created.",
              draft.email,
              () => setDraft({ email: "", name: "", role: "editor" }),
            );
          }}
        >
          <Field label="Email">
            <input
              type="email"
              required
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Name">
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Role">
            <select
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              className={SELECT}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" variant="primary" disabled={pending}>
            Add
          </Button>
        </form>
      </Panel>

      <Panel title={`Team (${rows.length})`}>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.userId} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">
                  {r.name ?? "—"} {r.userId === me && <span className="text-xs text-fg-2">(you)</span>}
                  {!r.active && (
                    <span className="ml-2 rounded-full bg-chip px-2 py-0.5 text-xs font-bold uppercase">Inactive</span>
                  )}
                </p>
                <p className="break-all text-sm text-fg-2">
                  {r.email ?? "unknown email"} · 2FA {r.twoFactor ? "on" : "off"} · last sign-in{" "}
                  {r.lastSignIn ? fmt.format(new Date(r.lastSignIn)) : "never"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Role for ${r.name ?? r.email}`}
                  value={r.role}
                  disabled={pending}
                  onChange={(e) => run(() => updateStaff(r.userId, { role: e.target.value }), "Role changed.")}
                  className={`${SELECT} h-9 w-auto py-1 text-sm`}
                >
                  {ROLES.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.value}
                    </option>
                  ))}
                </select>
                <Button
                  className="h-9 text-xs"
                  disabled={pending}
                  variant={armed === `active-${r.userId}` ? "danger" : "plain"}
                  onClick={() =>
                    confirmFirst(`active-${r.userId}`, () =>
                      run(
                        () => updateStaff(r.userId, { active: !r.active }),
                        r.active ? "Access removed." : "Access restored.",
                      ),
                    )
                  }
                >
                  {armed === `active-${r.userId}` ? "Confirm" : r.active ? "Deactivate" : "Reactivate"}
                </Button>
                <Button
                  className="h-9 text-xs"
                  disabled={pending}
                  variant={armed === `pw-${r.userId}` ? "danger" : "ghost"}
                  onClick={() =>
                    confirmFirst(`pw-${r.userId}`, () =>
                      run(() => resetPassword(r.userId), "Password reset.", r.email ?? "this person"),
                    )
                  }
                >
                  {armed === `pw-${r.userId}` ? "Confirm" : "Reset password"}
                </Button>
                {r.twoFactor && (
                  <Button
                    className="h-9 text-xs"
                    disabled={pending}
                    variant={armed === `2fa-${r.userId}` ? "danger" : "ghost"}
                    onClick={() =>
                      confirmFirst(`2fa-${r.userId}`, () =>
                        run(
                          () => resetTwoFactor(r.userId),
                          "Two-factor sign-in reset. They set it up again next time.",
                        ),
                      )
                    }
                  >
                    {armed === `2fa-${r.userId}` ? "Confirm" : "Reset 2FA"}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-fg-2">
          Deactivated people can still sign in but see “no access” and can’t read or change anything.
        </p>
      </Panel>
    </div>
  );
}
