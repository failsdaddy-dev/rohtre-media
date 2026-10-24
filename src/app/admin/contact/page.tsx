import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFrame, AdminLoading } from "@/components/admin/admin-frame";
import { parseContact } from "@/content/contact-schema";
import { requireStaff } from "@/lib/auth";
import { contactJsonSchemas } from "@/lib/json-schemas";
import { supabaseServer } from "@/lib/supabase/server";
import { ContactEditor } from "./contact-editor";

export const metadata: Metadata = { title: "Contact page" };

async function ContactScreen() {
  const staff = await requireStaff();
  const sb = await supabaseServer();
  const { data } = await sb.from("page_content").select("data").eq("key", "contact").maybeSingle();
  return (
    <AdminFrame staff={staff} current="/admin/contact" title="Contact page">
      <ContactEditor initial={parseContact(data?.data)} schemas={contactJsonSchemas()} />
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
