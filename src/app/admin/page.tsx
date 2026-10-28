import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { ADMIN_TABS, Panel, type AdminTab } from "@/components/admin/ui";
import { canManage, requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

type LeadRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  interest: string | null;
  page_path: string;
  utm_source: string | null;
};

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const cell = "px-2 py-2.5";
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-fg-2">
          <tr>
            {["When", "Name", "Phone", "Email", "Interested in", "Page", "Source"].map((h) => (
              <th key={h} className="px-2 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-line">
              <td className={`${cell} whitespace-nowrap`}>{fmt.format(new Date(l.created_at))}</td>
              <td className={`${cell} font-medium`}>{l.name}</td>
              <td className={`${cell} whitespace-nowrap`}>
                <a href={`tel:${l.phone}`} className="hover:text-brand">
                  {l.phone}
                </a>
              </td>
              <td className={cell}>
                <a href={`mailto:${l.email}`} className="hover:text-brand">
                  {l.email}
                </a>
              </td>
              <td className={cell}>{l.interest ?? "—"}</td>
              <td className={`${cell} text-fg-2`}>{l.page_path}</td>
              <td className={`${cell} text-fg-2`}>{l.utm_source ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The Overview's "Find your way": every admin page as a card, grouped by job. */
const FIND_GROUPS: { title: string; text: string; hrefs: string[] }[] = [
  {
    title: "Edit the website",
    text: "Text, images and videos on the main pages. Save and it’s live.",
    hrefs: ["/admin/home", "/admin/about", "/admin/work", "/admin/recognition", "/admin/careers", "/admin/contact"],
  },
  {
    title: "Ads & landing pages",
    text: "Pages for your Meta and Google ads, and the proof they show.",
    hrefs: ["/admin/pages", "/admin/proof", "/admin/routing"],
  },
  {
    title: "Enquiries",
    text: "People who contacted you or applied for a job.",
    hrefs: ["/admin/leads", "/admin/applications"],
  },
  {
    title: "Files, settings & help",
    text: "Uploads, contact details, users and how-to.",
    hrefs: ["/admin/media", "/admin/settings", "/admin/users", "/admin/audit", "/admin/guide"],
  },
];

function FindYourWay({ allowed }: { allowed: (t: AdminTab) => boolean }) {
  const byHref = new Map(ADMIN_TABS.map((t) => [t.href, t]));
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {FIND_GROUPS.map((g) => {
        const tabs = g.hrefs.map((h) => byHref.get(h)).filter((t): t is AdminTab => !!t && allowed(t));
        if (tabs.length === 0) return null;
        return (
          <section key={g.title} className="rounded-[18px] border border-line bg-bg-elev p-5 sm:p-6">
            <h2 className="text-lg font-bold">{g.title}</h2>
            <p className="mt-1 text-sm text-fg-2">{g.text}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {tabs.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:border-brand hover:bg-[color-mix(in_srgb,var(--brand)_5%,transparent)]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{t.label}</span>
                      <span className="block text-xs text-fg-2">{t.hint}</span>
                    </span>
                    <span aria-hidden="true" className="text-fg-2 transition-transform group-hover:translate-x-1 group-hover:text-brand">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

async function Overview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const staff = await requireStaff();
  const denied = (await searchParams).denied === "1";
  const manager = canManage(staff.role);

  let leads: LeadRow[] = [];
  let total = 0;
  if (manager) {
    const sb = await supabaseServer();
    const { data, count } = await sb
      .from("leads")
      .select("id, created_at, name, email, phone, interest, page_path, utm_source", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(20);
    leads = (data ?? []) as LeadRow[];
    total = count ?? 0;
  }

  return (
    <AdminFrame staff={staff} current="/admin" title={`Hello${staff.name ? `, ${staff.name.split(" ")[0]}` : ""}`}>
      {denied && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] px-4 py-3 text-sm"
        >
          That page is for the owner and developer only.
        </p>
      )}
      <div className="flex flex-col gap-6">
        {manager ? (
          <Panel title={`Website leads (${total})`}>
            {leads.length === 0 ? (
              <p className="text-fg-2">No leads yet. They appear here as soon as someone sends the contact form.</p>
            ) : (
              <LeadsTable leads={leads} />
            )}
            <p className="mt-4 text-sm">
              <Link href="/admin/leads" className="underline underline-offset-2">
                All leads, search and CSV export
              </Link>
            </p>
          </Panel>
        ) : (
          <Panel title="Welcome">
            <p className="text-fg-2">
              Edit{" "}
              <Link href="/admin/pages" className="underline underline-offset-2">
                landing pages
              </Link>
              , the{" "}
              <Link href="/admin/home" className="underline underline-offset-2">
                home page
              </Link>{" "}
              and{" "}
              <Link href="/admin/proof" className="underline underline-offset-2">
                proof
              </Link>
              . The developer publishes your drafts. Leads and settings are for the owner and developer only.
            </p>
          </Panel>
        )}
        <div>
          <h2 className="mb-1 text-xl font-bold">Find your way</h2>
          <p className="mb-4 text-sm text-fg-2">
            Pick what you want to do. Tip: press <kbd className="rounded border border-line px-1 text-xs">Ctrl K</kbd>{" "}
            anywhere and type a word like “logo” or “WhatsApp”. New here?{" "}
            <Link href="/admin/guide" className="font-semibold text-brand underline underline-offset-2">
              Read the 2-minute guide
            </Link>
            .
          </p>
          <FindYourWay allowed={(t) => (!t.manage || manager) && (!t.owner || staff.role === "owner")} />
        </div>
      </div>
    </AdminFrame>
  );
}

export default function Page(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Overview searchParams={props.searchParams} />
    </Suspense>
  );
}
