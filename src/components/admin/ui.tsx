import type { ButtonHTMLAttributes, ReactNode } from "react";

// Small, consistent building blocks for the admin panel (R44), in the
// RohTre Vault style: chip tabs, pill buttons, rounded fields.

export type AdminTab = {
  href: string;
  label: string;
  /** primary = in the top row; more = the "More" menu; account = the account menu. */
  group: "primary" | "more" | "account";
  manage?: boolean;
  owner?: boolean;
};

/** Every admin page, in menu order. Routes and role rules are unchanged. */
export const ADMIN_TABS: AdminTab[] = [
  { href: "/admin", label: "Overview", group: "primary" },
  { href: "/admin/home", label: "Home page", group: "primary" },
  { href: "/admin/pages", label: "Landing pages", group: "primary" },
  { href: "/admin/proof", label: "Proof & badges", group: "primary" },
  { href: "/admin/media", label: "Media", group: "primary" },
  { href: "/admin/leads", label: "Leads", group: "primary", manage: true },
  { href: "/admin/routing", label: "Redirects & ads", group: "more" },
  { href: "/admin/settings", label: "Settings", group: "more", manage: true },
  { href: "/admin/users", label: "Users", group: "more", owner: true },
  { href: "/admin/audit", label: "Audit log", group: "more", manage: true },
  { href: "/admin/security", label: "Password", group: "account" },
];

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "plain" | "danger" | "ghost" };

export function Button({ variant = "plain", className = "", ...rest }: BtnProps) {
  const look = {
    primary: "bg-chip-on-bg text-chip-on-fg enabled:hover:opacity-90",
    plain: "bg-chip enabled:hover:bg-chip-hover",
    danger: "bg-brand text-brand-fg enabled:hover:opacity-90",
    ghost: "enabled:hover:bg-hover",
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      className={`rm-press inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
    />
  );
}

export const INPUT_CLASS = "rm-field w-full px-3.5 py-2.5 text-[15px] outline-none";
// Dropdowns: use <Select> (./select.tsx), never a native <select>.

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 text-sm ${className}`}>
      <span className="font-semibold">{label}</span>
      {children}
      {hint && <span className="text-xs text-fg-2">{hint}</span>}
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
