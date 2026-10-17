import "server-only";
import { createHmac } from "node:crypto";
import { supabaseSecretKey } from "./env.server";
import type { Lead } from "./lead-schema";
import { CONSENT_VERSION } from "./lead-schema";
import { supabaseAdmin } from "./supabase/admin";

/** One-way hash of the visitor's IP: lets us rate-limit without storing the IP. */
export function hashIp(ip: string): string {
  const salt = process.env.LEAD_HASH_SALT || supabaseSecretKey() || "rohtre";
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

export function clientIp(headers: Headers): string {
  return (headers.get("x-forwarded-for")?.split(",")[0] ?? headers.get("x-real-ip") ?? "unknown").trim();
}

/** True if this IP may submit again (5 leads per 10 minutes). */
export async function allowLead(ipHash: string): Promise<boolean> {
  const sb = supabaseAdmin();
  if (!sb) return true; // saveLead reports the missing setup
  const { data, error } = await sb.rpc("hit_rate_limit", {
    p_key: `lead:${ipHash}`,
    p_limit: 5,
    p_window_seconds: 600,
  });
  if (error) return true; // never lose a real lead because the limiter failed
  return data === true;
}

export async function saveLead(lead: Lead, meta: { ipHash: string; userAgent: string | null }) {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("supabase_not_configured");
  const a = lead.attribution;
  const now = new Date().toISOString();
  const row = {
    page_path: lead.pagePath,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    business_type: lead.businessType ?? null,
    website: lead.website ?? null,
    ad_spend_range: lead.adSpendRange ?? null,
    interest: lead.interest ?? null,
    message: lead.message ?? null,
    consent: true,
    consent_at: now,
    consent_text_version: CONSENT_VERSION,
    utm_source: a.utm_source ?? null,
    utm_medium: a.utm_medium ?? null,
    utm_campaign: a.utm_campaign ?? null,
    utm_term: a.utm_term ?? null,
    utm_content: a.utm_content ?? null,
    gclid: a.gclid ?? null,
    fbclid: a.fbclid ?? null,
    referrer: a.referrer ?? null,
    user_agent: meta.userAgent?.slice(0, 500) ?? null,
    ip_hash: meta.ipHash,
  };
  const { data, error } = await sb.from("leads").insert(row).select("id, created_at").single();
  if (error) throw error;
  return { id: data.id as string, createdAt: data.created_at as string, row };
}

/**
 * Copies the lead to the founder's Google Sheet through a Google Apps Script
 * web app (docs/setup/google-sheets-leads.md). Optional: skipped when
 * LEADS_SHEET_WEBHOOK_URL is not set. Failures are logged, never shown to the
 * visitor; the lead is already safe in Supabase.
 */
export async function sendLeadToSheet(id: string, createdAt: string, row: Record<string, unknown>) {
  const url = process.env.LEADS_SHEET_WEBHOOK_URL;
  const secret = process.env.LEADS_SHEET_SECRET;
  if (!url || !secret) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, id, created_at: createdAt, ...row, ip_hash: undefined, user_agent: undefined }),
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`sheet ${res.status}`);
    await supabaseAdmin()?.from("leads").update({ sheet_synced_at: new Date().toISOString() }).eq("id", id);
  } catch (err) {
    console.error("lead sheet sync failed", id, err);
  }
}
