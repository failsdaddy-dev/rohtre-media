// POST: the one submission route for every lead form on the site (R10).
// Order: same-site check -> validate -> spam signals -> rate limit -> save
// in Supabase -> (after the response) copy to the Google Sheet.
import { after } from "next/server";
import { leadSchema, looksLikeSpam } from "@/lib/lead-schema";
import { allowLead, clientIp, hashIp, saveLead, sendLeadToSheet } from "@/lib/leads.server";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  // Only our own pages may post here.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json({ error: "forbidden" }, 403);

  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return json({ error: "invalid", fields }, 400);
  }
  const lead = parsed.data;

  // Bots get a normal-looking success and nothing is saved.
  if (looksLikeSpam(lead, Date.now())) return json({ ok: true });

  const ipHash = hashIp(clientIp(request.headers));
  if (!(await allowLead(ipHash))) return json({ error: "too_many" }, 429);

  try {
    const saved = await saveLead(lead, { ipHash, userAgent: request.headers.get("user-agent") });
    after(() => sendLeadToSheet(saved.id, saved.createdAt, saved.row));
    return json({ ok: true });
  } catch (err) {
    console.error("lead save failed", err);
    return json({ error: "server" }, 500);
  }
}
