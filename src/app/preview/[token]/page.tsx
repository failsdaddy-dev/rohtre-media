import { createHash } from "node:crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteChrome } from "@/components/site-chrome";
import { getBadges } from "@/lib/home-data";
import { getLandingProof } from "@/lib/landing-data";
import { getSettings } from "@/lib/settings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { whatsappLink } from "@/lib/whatsapp";
import { LandingSections } from "@/sections/render";
import { pageContentSchema } from "@/sections/schemas";
import { pageHeaderTone } from "@/sections/tone";

// Expiring preview links (R24): /preview/<token> shows one saved version of
// a page to anyone holding the link, until it expires. Never cached, never
// indexed (noindex here, X-Robots-Tag and robots.txt for /preview).

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false, nocache: true } };

async function Preview({ params }: { params: Promise<{ token: string }> }) {
  await connection(); // per request: the link may expire at any moment
  const { token } = await params;
  const db = supabaseAdmin();
  if (!db || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: link } = await db
    .from("preview_tokens")
    .select("page_id, version_id, expires_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (!link || new Date(link.expires_at) < new Date()) notFound();

  const [{ data: version }, { data: dims }] = await Promise.all([
    db.from("page_versions").select("content").eq("id", link.version_id).maybeSingle(),
    db.from("page_dimensions").select("value_id").eq("page_id", link.page_id),
  ]);
  const parsed = pageContentSchema.safeParse(version?.content);
  if (!parsed.success) notFound();

  const [proof, badges, settings] = await Promise.all([
    getLandingProof((dims ?? []).map((d) => d.value_id as string)),
    getBadges(),
    getSettings(),
  ]);
  const whatsappHref = settings.whatsapp.enabled ? whatsappLink(settings.whatsapp.number, "Hi RohTre Media") : null;
  return (
    <SiteChrome tone={pageHeaderTone(parsed.data)}>
      <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-fg shadow-lg">
        Preview · expires {new Date(link.expires_at).toLocaleDateString("en-IN")}
      </p>
      <LandingSections sections={parsed.data.sections} ctx={{ proof, badges, settings, whatsappHref }} />
    </SiteChrome>
  );
}

export default function Page({ params }: PageProps<"/preview/[token]">) {
  return (
    <Suspense fallback={null}>
      <Preview params={params} />
    </Suspense>
  );
}
