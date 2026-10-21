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
let tmpPageId = null;
const tmpSlugs = [];
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

  // Proof that isn't approved never reaches the public (R11, R19).
  const a7 = await rest("badges?select=id,enabled", { key: ANON });
  check(
    "visitor sees only switched-on badges",
    Array.isArray(a7.json) && a7.json.every((b) => b.enabled),
    `status ${a7.status}`,
  );

  const a8 = await rest("testimonials?select=id,approved,is_placeholder", { key: ANON });
  check(
    "visitor sees only approved testimonials",
    Array.isArray(a8.json) && a8.json.every((t) => t.approved && !t.is_placeholder),
    `status ${a8.status}`,
  );

  const a9 = await rest("results?select=id,approved,is_placeholder", { key: ANON });
  check(
    "visitor never sees placeholder results",
    Array.isArray(a9.json) && a9.json.every((r) => r.approved && !r.is_placeholder),
    `status ${a9.status}`,
  );

  const a10 = await rest("testimonials", {
    key: ANON,
    method: "POST",
    body: { quote: "x", person_name: "x", approved: true },
  });
  check("visitor cannot add testimonials", a10.status >= 400, `status ${a10.status}`);

  const a11 = await rest("page_content?key=eq.home", {
    key: ANON,
    method: "PATCH",
    body: { data: {} },
    prefer: "return=representation",
  });
  check(
    "visitor cannot edit page content",
    a11.status >= 400 || (Array.isArray(a11.json) && a11.json.length === 0),
    `status ${a11.status}`,
  );

  // The database itself refuses an approved placeholder.
  const s00 = await rest("results", {
    key: SECRET,
    method: "POST",
    body: { brand_name: "rls-test", metric_value: "1", metric_label: "x", approved: true, is_placeholder: true },
  });
  check("database refuses an approved placeholder result", s00.status >= 400, `status ${s00.status}`);

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

  // ------------------------------------------------------------ landing pages (Phase 3)
  const tmpSlug = `rls-check-${randomUUID().slice(0, 8)}`;
  const tmp = await rest("pages", {
    key: SECRET,
    method: "POST",
    body: { slug: tmpSlug, status: "draft", visibility: "unlisted" },
    prefer: "return=representation",
  });
  tmpPageId = tmp.json?.[0]?.id ?? null;
  const tv = await rest("page_versions", {
    key: SECRET,
    method: "POST",
    body: { page_id: tmpPageId, number: 1, content: { meta: {}, sections: [] } },
    prefer: "return=representation",
  });
  await rest(`pages?id=eq.${tmpPageId}`, {
    key: SECRET,
    method: "PATCH",
    body: { draft_version_id: tv.json?.[0]?.id },
  });

  const l1 = await rest(`pages?select=id&id=eq.${tmpPageId}`, { key: ANON });
  check(
    "visitor cannot see draft landing pages",
    Array.isArray(l1.json) && l1.json.length === 0,
    `status ${l1.status}`,
  );
  const l2 = await rest(`page_versions?select=id&page_id=eq.${tmpPageId}`, { key: ANON });
  check(
    "visitor cannot read draft page content",
    Array.isArray(l2.json) && l2.json.length === 0,
    `status ${l2.status}`,
  );
  const l3 = await rest("pages", { key: ANON, method: "POST", body: { slug: `${tmpSlug}-x` } });
  check("visitor cannot create pages", l3.status >= 400, `status ${l3.status}`);
  const l4 = await rest(`pages?id=eq.${tmpPageId}`, {
    key: ANON,
    token,
    method: "PATCH",
    body: { status: "published", published_version_id: tv.json?.[0]?.id },
    prefer: "return=representation",
  });
  const l4b = await rest(`pages?select=status&id=eq.${tmpPageId}`, { key: SECRET });
  check("editor cannot publish a page", l4.status >= 400 && l4b.json?.[0]?.status === "draft", `status ${l4.status}`);
  const l5 = await rest(`pages?id=eq.${tmpPageId}`, {
    key: ANON,
    token,
    method: "PATCH",
    body: { visibility: "public" },
  });
  check("editor cannot change visibility", l5.status >= 400, `status ${l5.status}`);

  await rest(`pages?id=eq.${tmpPageId}`, { key: SECRET, method: "PATCH", body: { slug: `${tmpSlug}-new` } });
  const l6 = await rest(`redirects?select=to_path&from_path=eq./lp/${tmpSlug}`, { key: ANON });
  check(
    "changing a slug adds a 301 from the old address (R3)",
    Array.isArray(l6.json) && l6.json[0]?.to_path === `/lp/${tmpSlug}-new`,
    JSON.stringify(l6.json),
  );
  tmpSlugs.push(tmpSlug, `${tmpSlug}-new`);

  const l7 = await rest("concept_works", { key: SECRET, method: "POST", body: { kind: "image", approved: true } });
  check("database refuses approved concept work without media", l7.status >= 400, `status ${l7.status}`);

  // ------------------------------------------------------------------ admin (Phase 4)
  for (const table of ["media", "audit_log", "preview_tokens", "ad_mappings"]) {
    const r = await rest(`${table}?select=*&limit=1`, { key: ANON });
    check(
      `visitor cannot read ${table}`,
      r.status >= 400 || (Array.isArray(r.json) && r.json.length === 0),
      `status ${r.status}`,
    );
  }
  const p1 = await rest("audit_log", {
    key: ANON,
    token,
    method: "POST",
    body: { actor_id: editorId, action: "rls.check", entity: "test" },
  });
  check("editor can append to the audit log as themself", p1.status === 201, `status ${p1.status}`);
  const p2 = await rest("audit_log", {
    key: ANON,
    token,
    method: "POST",
    body: { actor_id: randomUUID(), action: "rls.check", entity: "test" },
  });
  check("editor cannot write audit entries as someone else", p2.status >= 400, `status ${p2.status}`);
  const p3 = await rest("audit_log?select=id&limit=5", { key: ANON, token });
  check(
    "editor cannot read the audit log",
    p3.status >= 400 || (Array.isArray(p3.json) && p3.json.length === 0),
    `status ${p3.status}`,
  );
  const p4 = await rest(`audit_log?actor_id=eq.${editorId}`, { key: ANON, token, method: "DELETE" });
  const p4b = await rest(`audit_log?select=id&actor_id=eq.${editorId}`, { key: SECRET });
  check(
    "nobody signed in can delete audit history",
    p4.status >= 400 && Array.isArray(p4b.json) && p4b.json.length === 1,
    `status ${p4.status}`,
  );
  const p5 = await rest("redirects", {
    key: ANON,
    token,
    method: "POST",
    body: { from_path: `/rls-${tmpSlug}`, to_path: "/" },
  });
  check("editor cannot add redirects", p5.status >= 400, `status ${p5.status}`);
  const p6 = await rest("ad_mappings", {
    key: ANON,
    token,
    method: "POST",
    body: { platform: "google", campaign: "RLS check" },
    prefer: "return=representation",
  });
  const mappingId = p6.json?.[0]?.id;
  check("editor can add an ad-mapping row", p6.status === 201 && Boolean(mappingId), `status ${p6.status}`);
  if (mappingId) await rest(`ad_mappings?id=eq.${mappingId}`, { key: ANON, token, method: "DELETE" });
  const p7 = await rest("page_content?select=key", {
    key: ANON,
    token,
    method: "DELETE",
    prefer: "return=representation",
  });
  check(
    "editor cannot delete home page content",
    p7.status >= 400 || (Array.isArray(p7.json) && p7.json.length === 0),
    `status ${p7.status}`,
  );
} finally {
  if (editorId) await rest(`audit_log?actor_id=eq.${editorId}`, { key: SECRET, method: "DELETE" });
  if (tmpPageId) await rest(`pages?id=eq.${tmpPageId}`, { key: SECRET, method: "DELETE" });
  for (const sl of tmpSlugs) await rest(`redirects?from_path=eq./lp/${sl}`, { key: SECRET, method: "DELETE" });
  await rest("redirects?from_path=like./rls-rls-check-*", { key: SECRET, method: "DELETE" });
  await rest("ad_mappings?campaign=eq.RLS check", { key: SECRET, method: "DELETE" });
  if (leadId) await rest(`leads?id=eq.${leadId}`, { key: SECRET, method: "DELETE" });
  await rest("rate_limits?key=like.rls-*", { key: SECRET, method: "DELETE" });
  if (editorId) await admin(`users/${editorId}`, { method: "DELETE" });
  console.log("cleanup: test lead, test page, redirects and test editor removed");
}

const failed = results.filter((r) => !r).length;
console.log(failed ? `\n${failed} check(s) FAILED` : `\nAll ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
