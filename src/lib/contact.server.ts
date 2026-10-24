import "server-only";
import nodemailer from "nodemailer";
import { CONTACT_CONSENT_VERSION, enquiryPhone, type Enquiry } from "./contact-enquiry";
import { supabaseAdmin } from "./supabase/admin";
import { whatsappLink } from "./whatsapp";

// What happens to a Contact page enquiry (route: /api/contact):
//   1. saved in public.leads (server only, secret key; RLS has no public
//      policies), page_path = the page it came from
//   2. emailed to sales through the same Gmail SMTP account as the careers
//      form. A failed email never loses the enquiry: the failure is written
//      to leads.notify_error for Admin → Leads.
// Env (server only): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (shared with
// careers); CONTACT_NOTIFY_EMAIL (comma-separated), else
// CAREERS_NOTIFY_FALLBACK, else the sending account.

type Meta = { ipHash: string; sourcePage: string; userAgent: string | null };

export async function saveEnquiry(e: Enquiry, meta: Meta): Promise<string> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("supabase_not_configured");
  const a = e.attribution;
  const { data, error } = await sb
    .from("leads")
    .insert({
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
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

function salesEmails(): string[] {
  const list = process.env.CONTACT_NOTIFY_EMAIL || process.env.CAREERS_NOTIFY_FALLBACK || process.env.SMTP_USER || "";
  return list
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
/** Header text: one line, no control characters. */
const oneLine = (v: string) => v.replace(/[\r\n\t]+/g, " ").trim();

/** The sales email: HTML (every visitor value escaped) with a plain-text copy. No tracking pixels. */
export async function emailSales(e: Enquiry, sourcePage: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("smtp_not_configured");
  const to = salesEmails();
  if (to.length === 0) throw new Error("no_sales_email");
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const when = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const phone = enquiryPhone(e);
  const wa = whatsappLink(phone, `Hi ${e.fullName}, this is RohTre Media about your enquiry.`);
  const interests = e.interests.join(", ");

  const rows: [string, string, string?][] = [
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

  const cell = "padding:10px 14px;border-bottom:1px solid #eceef2;vertical-align:top;font-size:14px;line-height:1.5";
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#111827">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb">
<tr><td style="padding:20px 24px;background:#e50914;color:#ffffff">
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.9">RohTre Media</div>
<div style="font-size:20px;font-weight:bold;margin-top:4px">New sales enquiry</div>
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
Reply to this email to answer the client directly. All enquiries: Admin → Leads.
</td></tr>
</table>
</body></html>`;

  const text = [
    "RohTre Media: new sales enquiry",
    "",
    ...rows.map(([label, value, link]) => `${label}: ${value}${link && link !== value ? ` (${link})` : ""}`),
    "",
    "Reply to this email to answer the client directly. All enquiries: Admin → Leads.",
  ].join("\n");

  await transport.sendMail({
    from: `"RohTre Media Website" <${process.env.SMTP_USER}>`,
    to,
    replyTo: e.email,
    subject: oneLine(
      `[SALES ENQUIRY] ${e.fullName}, ${e.businessType || "Business type not given"}, ${interests || "Interest not given"}`,
    ).slice(0, 200),
    text,
    html,
  });
}

export async function noteEnquiryError(id: string, message: string) {
  await supabaseAdmin()
    ?.from("leads")
    .update({ notify_error: message.slice(0, 300) })
    .eq("id", id);
}
