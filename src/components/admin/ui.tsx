import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// Small, consistent building blocks for the admin panel (R44), in the
// RohTre Vault style: chip tabs, pill buttons, rounded fields.

export const ADMIN_TABS: { href: string; label: string; manage?: boolean; owner?: boolean }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/pages", label: "Landing pages" },
  { href: "/admin/home", label: "Home page" },
  { href: "/admin/proof", label: "Proof & badges" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/leads", label: "Leads", manage: true },
  { href: "/admin/routing", label: "Redirects & ads" },
  { href: "/admin/settings", label: "Settings", manage: true },
  { href: "/admin/users", label: "Users", owner: true },
  { href: "/admin/audit", label: "Audit log", manage: true },
  { href: "/admin/security", label: "Password" },
];

export function AdminTabs({ current, canManage, isOwner }: { current: string; canManage: boolean; isOwner: boolean }) {
  return (
    <nav aria-label="Admin" className="no-scrollbar -mx-1.5 flex gap-3 overflow-x-auto px-1.5 py-3">
      {ADMIN_TABS.filter((t) => (!t.manage || canManage) && (!t.owner || isOwner)).map((t) => {
        const on = t.href === "/admin" ? current === "/admin" : current.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`rm-press flex h-9 shrink-0 items-center rounded-lg px-3.5 text-sm font-medium ${
              on ? "bg-chip-on-bg text-chip-on-fg" : "bg-chip hover:bg-chip-hover"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

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
