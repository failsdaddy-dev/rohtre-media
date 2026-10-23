// POST: the careers application form (multipart: fields + optional resume).
// Order: same-site check -> validate (same rules as the form, plus the
// admin's role/experience lists) -> honeypot -> rate limit -> save ->
// email HR (resume attached, never stored) -> WhatsApp HR (off by default).
// The applicant sees success when the application was saved or emailed;
// a failed notification is noted for the admin. No tracking or ad
// conversion event is involved anywhere.
import {
  applicationSchema,
  OTHER_ROLE,
  RESUME_MAX_BYTES,
  RESUME_TYPES,
  resumeLooksValid,
} from "@/lib/career-application";
import { getCareersContent } from "@/lib/careers-data";
import { emailHr, noteNotifyError, saveApplication, whatsappHr, type Resume } from "@/lib/careers.server";
import { clientIp, hashIp } from "@/lib/leads.server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v : undefined;
};

/** 3 applications per 10 minutes per IP. */
async function allow(ipHash: string): Promise<boolean> {
  const sb = supabaseAdmin();
  if (!sb) return true;
  const { data, error } = await sb.rpc("hit_rate_limit", { p_key: `career:${ipHash}`, p_limit: 3, p_window_seconds: 600 });
  if (error) return true; // never lose a real application because the limiter failed
  return data === true;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json({ error: "forbidden" }, 403);

  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: "invalid", fields: {} }, 400);

  const parsed = applicationSchema.safeParse({
    category: str(form, "category"),
    fullName: str(form, "fullName") ?? "",
    email: str(form, "email") ?? "",
    dialCode: str(form, "dialCode") ?? "",
    phone: str(form, "phone") ?? "",
    role: str(form, "role") ?? "",
    otherRole: str(form, "otherRole") || undefined,
    experience: str(form, "experience") ?? "",
    portfolio: str(form, "portfolio") ?? "",
    message: str(form, "message") ?? "",
    consent: form.get("consent") === "on",
    fax: str(form, "fax"),
  });
  const fields: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;

  // Only the choices the admin offers.
  const { form: choices } = await getCareersContent();
  if (parsed.success) {
    if (parsed.data.role !== OTHER_ROLE && !choices.roles.includes(parsed.data.role)) fields.role = "Choose a role.";
    if (!choices.experience.includes(parsed.data.experience)) fields.experience = "Choose your experience.";
  }

  let resume: Resume | null = null;
  const file = form.get("resume");
  if (file instanceof File && file.size > 0) {
    if (file.size > RESUME_MAX_BYTES) fields.resume = "The resume must be 4 MB or smaller.";
    else {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!resumeLooksValid(bytes, file.type)) fields.resume = "Upload a PDF, DOC or DOCX file.";
      else {
        const base = file.name.replace(/[^A-Za-z0-9._ -]/g, "").slice(0, 80) || "resume";
        const ext = RESUME_TYPES[file.type];
        resume = { name: base.toLowerCase().endsWith(`.${ext}`) ? base : `${base}.${ext}`, type: file.type, bytes };
      }
    }
  }
  if (!parsed.success || Object.keys(fields).length) return json({ error: "invalid", fields }, 400);
  const app = parsed.data;

  // Bots get a normal-looking success and nothing happens.
  if (app.fax && app.fax.trim() !== "") return json({ ok: true });

  const ipHash = hashIp(clientIp(request.headers));
  if (!(await allow(ipHash))) return json({ error: "too_many" }, 429);

  const sourcePage = (() => {
    try {
      return new URL(request.headers.get("referer") ?? "/careers").pathname;
    } catch {
      return "/careers";
    }
  })();

  let id: string | null = null;
  try {
    id = await saveApplication(app, { ipHash, sourcePage }, resume?.name ?? null);
  } catch (err) {
    console.error("careers: save failed", err);
  }

  const problems: string[] = [];
  let emailed = false;
  try {
    await emailHr(app, resume);
    emailed = true;
  } catch (err) {
    console.error("careers: email failed", err);
    problems.push(`email: ${err instanceof Error ? err.message : "failed"}`);
  }
  try {
    await whatsappHr(app);
  } catch (err) {
    console.error("careers: whatsapp failed", err);
    problems.push(`whatsapp: ${err instanceof Error ? err.message : "failed"}`);
  }
  if (id && problems.length) await noteNotifyError(id, problems.join("; "));

  if (!id && !emailed) return json({ error: "server" }, 500);
  return json({ ok: true });
}
