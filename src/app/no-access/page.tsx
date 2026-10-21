import type { Metadata } from "next";
import { AuthCard, AuthShell } from "@/components/auth-shell";
import { LockIcon, LogoutIcon } from "@/components/icons";

export const metadata: Metadata = { title: "No access", robots: { index: false, follow: false } };

export default function NoAccess() {
  return (
    <AuthShell eyebrow="Team access" title="This account has" accent="no access">
      <AuthCard>
        <span className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-brand">
          <LockIcon size={22} />
        </span>
        <p className="mt-4 text-fg-2">
          Your account isn’t set up for the admin, or it has been switched off. Ask the site owner to check it.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="rm-press inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-chip-on-bg font-semibold text-chip-on-fg hover:opacity-90"
          >
            <LogoutIcon size={18} /> Sign out
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
