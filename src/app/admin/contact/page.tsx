import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { parseContact } from "@/content/contact-schema";
import { canManage, requireStaff } from "@/lib/auth";
import { contactJsonSchemas } from "@/lib/json-schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { ContactEditor } from "./contact-editor";
import { SalesEmails } from "./sales-emails";

export const metadata: Metadata = { title: "Contact page" };

async function ContactScreen() {
  const staff = await requireStaff();
  const manager = canManage(staff.role);
  const sb = await supabaseServer();
  const [{ data }, priv] = await Promise.all([
    sb.from("page_content").select("data").eq("key", "contact").maybeSingle(),
    manager ? sb.from("careers_private").select("sales_notify_emails").eq("id", true).maybeSingle() : null,
  ]);
  return (
    <AdminFrame staff={staff} current="/admin/contact" title="Contact page">
      <div className="flex flex-col gap-6">
        <ContactEditor initial={parseContact(data?.data)} schemas={contactJsonSchemas()} />
        {manager && <SalesEmails initial={(priv?.data?.sales_notify_emails as string[] | null) ?? []} />}
      </div>
    </AdminFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ContactScreen />
    </Suspense>
  );
}
