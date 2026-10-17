// Row-level-security check against the linked Supabase project (R39).
// Run: node --env-file=.env.local scripts/rls-check.mjs
//
// Creates a throwaway "editor" account, checks what a signed-out visitor and
// an editor can and cannot do, writes one test lead the way /api/leads does,
// then deletes the test lead and the test account. Prints PASS/FAIL per check
// and exits 1 if anything fails. Never prints keys.

import { randomUUID } from "node:crypto";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;
if (!URL_ || !ANON || !SECRET) {
  console.error("Missing Supabase values in .env.local");
  process.exit(1);
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? `  (${detail})` : ""}`);
};

async function rest(path, { key, token, method = "GET", body, prefer } = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* empty body */
  }
  return { status: res.status, json };
}

const admin = (path, init = {}) =>
  fetch(`${URL_}/auth/v1/admin/${path}`, {
    ...init,
    headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
  });

const testLead = {
  page_path: "/rls-check",
  name: "RLS Check",
  phone: "+910000000000",
  email: "rls-check@example.com",
  consent: true,
  consent_at: new Date().toISOString(),
  consent_text_version: "test",
};

let editorId = null;
let leadId = null;
try {
  // ---------------------------------------------------------- signed-out visitor
  const a1 = await rest("leads?select=id&limit=1", { key: ANON });
  check(
    "visitor cannot read leads",
    a1.status === 401 || a1.status === 403 || (Array.isArray(a1.json) && a1.json.length === 0),
    `status ${a1.status}`,
  );

  const a2 = await rest("leads", { key: ANON, method: "POST", body: testLead });
  check("visitor cannot write leads directly", a2.status >= 400, `status ${a2.status}`);

  const a3 = await rest("site_settings?select=data", { key: ANON });
  check(
    "visitor can read public settings",
    a3.status === 200 && Array.isArray(a3.json) && a3.json.length === 1,
    `status ${a3.status}`,
  );

  const a4 = await rest("site_settings?id=eq.true", {
    key: ANON,
    method: "PATCH",
    body: { data: {} },
    prefer: "return=representation",
  });
  check(
    "visitor cannot change settings",
    a4.status >= 400 || (Array.isArray(a4.json) && a4.json.length === 0),
    `status ${a4.status}`,
  );

  const a5 = await rest("profiles?select=user_id", { key: ANON });
  check(
    "visitor cannot read staff profiles",
    a5.status >= 400 || (Array.isArray(a5.json) && a5.json.length === 0),
    `status ${a5.status}`,
  );

  const a6 = await rest("rpc/hit_rate_limit", {
    key: ANON,
    method: "POST",
    body: { p_key: "x", p_limit: 1, p_window_seconds: 60 },
  });
  check("visitor cannot call the rate limiter", a6.status >= 400, `status ${a6.status}`);

  // -------------------------------------------------------------- server (lead intake)
  const s1 = await rest("leads", { key: SECRET, method: "POST", body: testLead, prefer: "return=representation" });
  leadId = s1.json?.[0]?.id ?? null;
  check("server can save a lead (form-to-database)", s1.status === 201 && Boolean(leadId), `status ${s1.status}`);

  const s2 = await rest("rpc/hit_rate_limit", {
    key: SECRET,
    method: "POST",
    body: { p_key: `rls-${randomUUID()}`, p_limit: 1, p_window_seconds: 60 },
  });
  const s3 = await rest("rpc/hit_rate_limit", {
    key: SECRET,
    method: "POST",
    body: { p_key: "rls-fixed-key", p_limit: 0, p_window_seconds: 60 },
  });
  check("rate limiter allows then blocks", s2.json === true && s3.json === false, `got ${s2.json}/${s3.json}`);

  // --------------------------------------------------------------------- editor
  const email = `rls-editor-${randomUUID().slice(0, 8)}@example.com`;
  const password = randomUUID();
  const created = await (
    await admin("users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true }) })
  ).json();
  editorId = created.id;
  await rest("profiles", { key: SECRET, method: "POST", body: { user_id: editorId, role: "editor", active: true } });
  const login = await (
    await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  ).json();
  const token = login.access_token;
  check("test editor can sign in", Boolean(token));

  const e1 = await rest("leads?select=id", { key: ANON, token });
  check(
    "editor cannot read leads",
    e1.status >= 400 || (Array.isArray(e1.json) && e1.json.length === 0),
    `status ${e1.status}, rows ${e1.json?.length}`,
  );

  const e2 = await rest("site_settings?id=eq.true", {
    key: ANON,
    token,
    method: "PATCH",
    body: { data: {} },
    prefer: "return=representation",
  });
  check(
    "editor cannot change settings",
    e2.status >= 400 || (Array.isArray(e2.json) && e2.json.length === 0),
    `status ${e2.status}`,
  );

  const e3 = await rest(`profiles?user_id=eq.${editorId}`, {
    key: ANON,
    token,
    method: "PATCH",
    body: { role: "owner" },
    prefer: "return=representation",
  });
  check(
    "editor cannot promote themself",
    e3.status >= 400 || (Array.isArray(e3.json) && e3.json.length === 0),
    `status ${e3.status}`,
  );

  const e4 = await rest("profiles?select=user_id,role", { key: ANON, token });
  check(
    "editor sees only their own profile",
    Array.isArray(e4.json) && e4.json.length === 1 && e4.json[0].user_id === editorId,
  );
} finally {
  if (leadId) await rest(`leads?id=eq.${leadId}`, { key: SECRET, method: "DELETE" });
  await rest("rate_limits?key=like.rls-*", { key: SECRET, method: "DELETE" });
  if (editorId) await admin(`users/${editorId}`, { method: "DELETE" });
  console.log("cleanup: test lead and test editor removed");
}

const failed = results.filter((r) => !r).length;
console.log(failed ? `\n${failed} check(s) FAILED` : `\nAll ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
