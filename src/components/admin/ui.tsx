import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

// Small, consistent building blocks for the admin panel (R44), in the
// RohTre Vault style: chip tabs, pill buttons, rounded fields.

export type AdminTab = {
  href: string;
  label: string;
  /**
   * primary = in the top row; company / legal = the "Company" and "Legal"
   * menus in the top row; more = the "More" menu; account = the account menu.
   */
  group: "primary" | "company" | "legal" | "more" | "account";
  /** One plain-words line: what you do there (Quick find, Overview cards, guide). */
  hint: string;
  manage?: boolean;
  owner?: boolean;
};

/** Every admin page, in menu order. Routes and role rules are unchanged. */
export const ADMIN_TABS: AdminTab[] = [
  { href: "/admin", label: "Overview", group: "primary", hint: "Start here: latest leads and shortcuts." },
  { href: "/admin/home", label: "Home page", group: "company", hint: "Hero, sections, numbers and videos on the home page." },
  { href: "/admin/about", label: "About page", group: "company", hint: "Story, team, numbers and the About video." },
  { href: "/admin/work", label: "Work page", group: "company", hint: "The Work page and the brand case-study pages." },
  { href: "/admin/recognition", label: "Recognition page", group: "company", hint: "Slider, awards and client quotes." },
  { href: "/admin/careers", label: "Careers page", group: "company", hint: "Roles, benefits, images and the careers FAQ." },
  { href: "/admin/contact", label: "Contact page", group: "company", hint: "Contact page text, next steps and form wording." },
  { href: "/admin/legal/terms-of-service", label: "Terms of Service", group: "legal", hint: "Legal text: terms." },
  { href: "/admin/legal/privacy-notice", label: "Privacy Notice", group: "legal", hint: "Legal text: privacy." },
  { href: "/admin/legal/fraudulent-use", label: "Fraudulent Use", group: "legal", hint: "Legal text: fraud warning." },
  { href: "/admin/legal/cookie-settings", label: "Cookie Settings", group: "legal", hint: "Legal text: cookies." },
  { href: "/admin/legal/do-not-sell", label: "Do Not Sell", group: "legal", hint: "Legal text: do not sell." },
  { href: "/admin/pages", label: "Landing pages", group: "primary", hint: "Create, edit, publish or delete ad landing pages (/lp/…)." },
  { href: "/admin/proof", label: "Proof & badges", group: "primary", hint: "Results, testimonials, creatives and partner badges." },
  { href: "/admin/media", label: "Media", group: "more", hint: "Every uploaded image and video in one library." },
  { href: "/admin/leads", label: "Leads", group: "primary", manage: true, hint: "Every enquiry from the website; search and CSV export." },
  { href: "/admin/applications", label: "Applications", group: "primary", manage: true, hint: "Job applications from the Careers page." },
  { href: "/admin/routing", label: "Redirects & ads", group: "more", hint: "Old-URL redirects and ad link settings." },
  { href: "/admin/settings", label: "Settings", group: "more", manage: true, hint: "Contact details, WhatsApp, form choices, publishing switch." },
  { href: "/admin/users", label: "Users", group: "more", owner: true, hint: "Who can sign in to the admin, and their role." },
  { href: "/admin/audit", label: "Audit log", group: "more", manage: true, hint: "Who changed what, and when." },
  { href: "/admin/guide", label: "Help & guide", group: "more", hint: "How the admin works, step by step." },
  { href: "/admin/security", label: "Password", group: "account", hint: "Change your password." },
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

/**
 * An on/off setting as one clear row: title, what it does, and a switch that
 * says On or Off. A real checkbox (role="switch"), so plain forms still post
 * it ("on" when checked); pass `checked` + `onChange` to control it instead.
 */
export function Toggle({
  label,
  hint,
  className = "",
  ...input
}: {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "className">) {
  return (
    <label
      className={`rm-toggle-row flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-[14px] border border-line bg-bg px-4 py-3.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${className}`}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[15px] font-semibold leading-snug">{label}</span>
        {hint && <span className="text-xs leading-relaxed text-fg-2">{hint}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2.5">
        <input type="checkbox" role="switch" {...input} />
        <span aria-hidden="true" className="rm-toggle-state" />
      </span>
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
