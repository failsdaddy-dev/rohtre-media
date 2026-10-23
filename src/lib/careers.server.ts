import "server-only";
import nodemailer from "nodemailer";
import { fullPhone, roleOf, type Application } from "./career-application";
import { supabaseAdmin } from "./supabase/admin";

// What happens to a careers application (route: /api/careers):
//   1. saved in public.careers_applications (server only, secret key; RLS
//      has no public policies)
//   2. emailed to HR through Gmail SMTP (free; an app password on the
//      sending Gmail account), with the resume attached if one was sent.
//      The resume is never stored anywhere else.
//   3. WhatsApp message to HR through the WhatsApp Business Cloud API:
//      prepared but OFF (CAREERS_WHATSAPP_ENABLED must be "true").
// A failed step never loses the application: the other steps still run and
// the failure is written to notify_error for the admin inbox.
// Env (server only): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
// CAREERS_NOTIFY_FALLBACK; WHATSAPP_* for step 3.

export type Resume = { name: string; type: string; bytes: Uint8Array };
type Meta = { ipHash: string; sourcePage: string };

export async function saveApplication(a: Application, meta: Meta, resumeName: string | null): Promise<string> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("supabase_not_configured");
  const { data, error } = await sb
    .from("careers_applications")
    .insert({
      category: a.category,
      full_name: a.fullName,
      email: a.email,
      phone: fullPhone(a),
      role: roleOf(a),
      experience: a.experience,
      portfolio_url: a.portfolio || null,
      message: a.message || null,
      resume_name: resumeName,
      consent_at: new Date().toISOString(),
      source_page: meta.sourcePage.slice(0, 200),
      ip_hash: meta.ipHash,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** HR addresses: Admin → Careers page → HR emails (private table), else CAREERS_NOTIFY_FALLBACK, else the sending account. */
async function hrEmails(): Promise<string[]> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data } = await sb.from("careers_private").select("notify_emails").eq("id", true).maybeSingle();
    const list = (data?.notify_emails as string[] | null) ?? [];
    if (list.length) return list;
  }
  const fallback = process.env.CAREERS_NOTIFY_FALLBACK || process.env.SMTP_USER;
  return fallback ? fallback.split(",").map((e) => e.trim()).filter(Boolean) : [];
}

export const mailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

/** Plain-text email (no HTML, so nothing the applicant typed can be injected). */
export async function emailHr(a: Application, resume: Resume | null): Promise<void> {
  if (!mailConfigured()) throw new Error("smtp_not_configured");
  const to = await hrEmails();
  if (to.length === 0) throw new Error("no_hr_email");
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const lines = [
    `New ${a.category} application from the Careers page.`,
    "",
    `Name: ${a.fullName}`,
    `Email: ${a.email}`,
    `Phone/WhatsApp: ${fullPhone(a)}`,
    `Role: ${roleOf(a)}`,
    `Experience: ${a.experience}`,
    `Portfolio/LinkedIn: ${a.portfolio || "-"}`,
    "",
    "Message:",
    a.message || "-",
    "",
    resume ? `Resume attached: ${resume.name}` : "No resume attached.",
    "",
    "All applications: Admin → Applications.",
  ];
  await transport.sendMail({
    from: `"RohTre Media Careers" <${process.env.SMTP_USER}>`,
    to,
    replyTo: a.email,
    subject: `Job application: ${roleOf(a)} (${a.category}) – ${a.fullName}`,
    text: lines.join("\n"),
    attachments: resume ? [{ filename: resume.name, content: Buffer.from(resume.bytes), contentType: resume.type }] : [],
  });
}

/**
 * Phase 2 (OFF): a WhatsApp template message to the HR number through the
 * WhatsApp Business Cloud API. Runs only when CAREERS_WHATSAPP_ENABLED is
 * "true" and WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_HR_NUMBER
 * and WHATSAPP_TEMPLATE are set (server env only). The template takes
 * three body parameters: name, role, phone.
 * verified: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
 */
export async function whatsappHr(a: Application): Promise<void> {
  if (process.env.CAREERS_WHATSAPP_ENABLED !== "true") return;
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_HR_NUMBER;
  const template = process.env.WHATSAPP_TEMPLATE;
  if (!token || !phoneId || !to || !template) throw new Error("whatsapp_not_configured");
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
        components: [
          {
            type: "body",
            parameters: [a.fullName, roleOf(a), fullPhone(a)].map((text) => ({ type: "text", text })),
          },
        ],
      },
    }),
  });
  if (!res.ok) throw new Error(`whatsapp ${res.status}`);
}

export async function noteNotifyError(id: string, message: string) {
  await supabaseAdmin()
    ?.from("careers_applications")
    .update({ notify_error: message.slice(0, 300) })
    .eq("id", id);
}
