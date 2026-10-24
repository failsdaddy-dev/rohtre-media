// POST: the Contact page enquiry form (JSON).
// Order: same-site check -> validate (same rules as the form, plus the
// admin's dropdown and chip lists) -> spam signals -> rate limit (shared
// with the lead route) -> save in public.leads -> email sales (after the
// response). The visitor sees success once the enquiry is saved (or, if
// saving failed, once it was emailed); a failed email is noted for Admin → Leads.
import { after } from "next/server";
import { getContactContent } from "@/lib/contact-data";
import { CONTACT_MIN_FILL_MS, enquirySchema } from "@/lib/contact-enquiry";
import { emailSales, noteEnquiryError, saveEnquiry } from "@/lib/contact.server";
import { allowLead, clientIp, hashIp } from "@/lib/leads.server";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const reason = (err: unknown) => `email: ${err instanceof Error ? err.message : "failed"}`;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json({ error: "forbidden" }, 403);

  const body = await request.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);
  const fields: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;

  // Only the choices the admin offers.
  if (parsed.success) {
    const { form } = await getContactContent();
    const e = parsed.data;
    if (e.businessType && !form.businessTypes.includes(e.businessType)) fields.businessType = "Choose a business type.";
    if (e.adSpend && !form.adSpend.includes(e.adSpend)) fields.adSpend = "Choose a monthly ad spend.";
    if (e.interests.some((i) => !form.interests.includes(i))) fields.interests = "Choose from the listed services.";
  }
  if (!parsed.success || Object.keys(fields).length) return json({ error: "invalid", fields }, 400);
  const enquiry = { ...parsed.data, interests: [...new Set(parsed.data.interests)] };

  // Bots get a normal-looking success and nothing is saved.
  const now = Date.now();
  if (
    (enquiry.fax && enquiry.fax.trim() !== "") ||
    now - enquiry.startedAt < CONTACT_MIN_FILL_MS ||
    enquiry.startedAt > now + 60_000
  )
    return json({ ok: true });

  const ipHash = hashIp(clientIp(request.headers));
  if (!(await allowLead(ipHash))) return json({ error: "too_many" }, 429);

  const sourcePage = (() => {
    try {
      return new URL(request.headers.get("referer") ?? "/contact").pathname;
    } catch {
      return "/contact";
    }
  })();

  let id: string | null = null;
  try {
    id = await saveEnquiry(enquiry, { ipHash, sourcePage, userAgent: request.headers.get("user-agent") });
  } catch (err) {
    console.error("contact: save failed", err);
  }

  if (id) {
    const saved = id;
    after(async () => {
      try {
        await emailSales(enquiry, sourcePage);
      } catch (err) {
        console.error("contact: email failed", err);
        await noteEnquiryError(saved, reason(err));
      }
    });
    return json({ ok: true });
  }

  // Not saved: the email is the only copy, so it must go out before we say "received".
  try {
    await emailSales(enquiry, sourcePage);
    return json({ ok: true });
  } catch (err) {
    console.error("contact: email failed", err);
    return json({ error: "server" }, 500);
  }
}
