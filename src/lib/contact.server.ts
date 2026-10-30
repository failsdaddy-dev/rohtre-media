import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { SITE_URL } from "./env";
import { CONTACT_CONSENT_VERSION, enquiryPhone, type Enquiry } from "./contact-enquiry";
import { supabaseAdmin } from "./supabase/admin";
import { whatsappLink } from "./whatsapp";

// What happens to a Contact page enquiry (route: /api/contact):
//   1. saved in public.leads (server only, secret key; RLS has no public
//      policies), page_path = the page it came from
//   2. emailed to sales through the same Gmail SMTP account as the careers
//      form. A failed email never loses the enquiry: the failure is written
//      to leads.notify_error for Admin → Leads.
//   3. copied to the Google Sheet (sendLeadToSheet, optional).
// Env (server only): SMTP_HOST, SMTP_PORT (shared with careers);
// SMTP_SALES_USER, SMTP_SALES_PASS (the sending mailbox, else SMTP_USER and
// SMTP_PASS). Recipients: Admin → Contact page → Sales emails (private table),
// else CONTACT_NOTIFY_EMAIL (comma-separated), else CAREERS_NOTIFY_FALLBACK,
// else the sending mailbox.

type Meta = { ipHash: string; sourcePage: string; userAgent: string | null };

export async function saveEnquiry(e: Enquiry, meta: Meta) {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("supabase_not_configured");
  const a = e.attribution;
  const row = {
    page_path: meta.sourcePage.slice(0, 500),
    name: e.fullName,
    phone: enquiryPhone(e),
    email: e.email,
    business_type: e.businessType || null,
    website: e.website || null,
    ad_spend_range: e.adSpend || null,
    // The first choice also goes in the older single column, so older screens still show it.
    interest: e.interests[0]?.slice(0, 80) ?? null,
    interested_in: e.interests.length ? e.interests : null,
    message: e.message || null,
    consent: true,
    consent_at: new Date().toISOString(),
    consent_text_version: CONTACT_CONSENT_VERSION,
    utm_source: a.utm_source?.slice(0, 200) ?? null,
    utm_medium: a.utm_medium?.slice(0, 200) ?? null,
    utm_campaign: a.utm_campaign?.slice(0, 200) ?? null,
    utm_term: a.utm_term?.slice(0, 200) ?? null,
    utm_content: a.utm_content?.slice(0, 200) ?? null,
    gclid: a.gclid?.slice(0, 300) ?? null,
    fbclid: a.fbclid?.slice(0, 300) ?? null,
    referrer: a.referrer?.slice(0, 500) ?? null,
    user_agent: meta.userAgent?.slice(0, 500) ?? null,
    ip_hash: meta.ipHash,
  };
  const { data, error } = await sb.from("leads").insert(row).select("id, created_at").single();
  if (error) throw error;
  return { id: data.id as string, createdAt: data.created_at as string, row };
}

/** The mailbox that sends enquiries: its own, or the shared one. Never mixes a user with another's password. */
function salesSender() {
  return process.env.SMTP_SALES_USER && process.env.SMTP_SALES_PASS
    ? { user: process.env.SMTP_SALES_USER, pass: process.env.SMTP_SALES_PASS }
    : { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
}

async function salesEmails(sender: string): Promise<string[]> {
  const res = await supabaseAdmin()?.from("careers_private").select("sales_notify_emails").eq("id", true).maybeSingle();
  const saved = (res?.data?.sales_notify_emails as string[] | null) ?? [];
  if (saved.length) return saved;
  const list = process.env.CONTACT_NOTIFY_EMAIL || process.env.CAREERS_NOTIFY_FALLBACK || sender;
  return list
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * The white wordmark for the email's red header, attached inline (cid), so it
 * shows in Gmail without loading anything from the web. From the local file
 * when it's there, else from the live site.
 */
const LOGO_FILE = "brand/logo-wordmark-white.png";
export function logoAttachment() {
  const local = path.join(process.cwd(), "public", LOGO_FILE);
  return {
    filename: "rohtre-media.png",
    path: existsSync(local) ? local : `${SITE_URL}/${LOGO_FILE}`,
    cid: "rohtre-logo",
  };
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
/** Header text: one line, no control characters. */
const oneLine = (v: string) => v.replace(/[\r\n\t]+/g, " ").trim();

/** One email row: label, value, optional link. */
export type EmailRow = [string, string, string?];

/**
 * The branded form email (red header with the logo, then label and value
 * rows). Every value is escaped. Needs logoAttachment() in the attachments.
 * No tracking pixels.
 */
export function brandedEmail(title: string, rows: EmailRow[], footer: string): string {
  const cell = "padding:10px 14px;border-bottom:1px solid #eceef2;vertical-align:top;font-size:14px;line-height:1.5";
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#111827">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb">
<tr><td style="padding:20px 24px;background:#e50914;color:#ffffff">
<img src="cid:rohtre-logo" width="150" height="40" alt="RohTre Media" style="display:block;border:0;width:150px;height:auto">
<div style="font-size:20px;font-weight:bold;margin-top:14px">${esc(title)}</div>
</td></tr>
<tr><td style="padding:8px 10px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
${rows
  .map(
    ([label, value, link]) =>
      `<tr><td style="${cell};width:160px;color:#6b7280;font-weight:bold">${esc(label)}</td><td style="${cell};white-space:pre-line">${
        link ? `<a href="${esc(link)}" style="color:#e50914">${esc(value)}</a>` : esc(value)
      }</td></tr>`,
  )
  .join("\n")}
</table>
</td></tr>
<tr><td style="padding:16px 24px;font-size:13px;color:#6b7280;line-height:1.5">
${esc(footer)}
</td></tr>
</table>
</body></html>`;
}

const FOOTER = "Reply to this email to answer the client directly. All enquiries: Admin → Leads.";

/** The sales email: the branded HTML with a plain-text copy. */
export async function emailSales(e: Enquiry, sourcePage: string): Promise<void> {
  const { user, pass } = salesSender();
  if (!user || !pass) throw new Error("smtp_not_configured");
  const to = await salesEmails(user);
  if (to.length === 0) throw new Error("no_sales_email");
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  const when = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const phone = enquiryPhone(e);
  const wa = whatsappLink(phone, `Hi ${e.fullName}, this is RohTre Media about your enquiry.`);
  const interests = e.interests.join(", ");

  const rows: EmailRow[] = [
    ["Name", e.fullName],
    ["WhatsApp / phone", phone, wa],
    ["Email", e.email, `mailto:${e.email}`],
    ["Business type", e.businessType || "Not given"],
    ["Website", e.website || "Not given", e.website || undefined],
    ["Monthly ad spend", e.adSpend || "Not given"],
    ["Interested in", interests || "Not given"],
    ["Message", e.message || "No message"],
    ["Submitted", `${when} (IST)`],
    ["Page", sourcePage],
  ];

  const html = brandedEmail("New sales enquiry", rows, FOOTER);

  const text = [
    "RohTre Media: new sales enquiry",
    "",
    ...rows.map(([label, value, link]) => `${label}: ${value}${link && link !== value ? ` (${link})` : ""}`),
    "",
    FOOTER,
  ].join("\n");

  await transport.sendMail({
    from: `"RohTre Media Website" <${user}>`,
    to,
    replyTo: e.email,
    subject: oneLine(
      `[SALES ENQUIRY] ${e.fullName}, ${e.businessType || "Business type not given"}, ${interests || "Interest not given"}`,
    ).slice(0, 200),
    text,
    html,
    attachments: [logoAttachment()],
  });
}

export async function noteEnquiryError(id: string, message: string) {
  await supabaseAdmin()
    ?.from("leads")
    .update({ notify_error: message.slice(0, 300) })
    .eq("id", id);
}
