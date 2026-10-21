// Runs before matching requests (Next.js 16 "proxy", formerly middleware).
// 1. Unlisted landing pages: refuse known AI crawlers with 403 (R42, second
//    layer after robots.txt). Ad-review bots always pass.
// 2. /login: answers 404 when a secret sign-in address is set (the secret
//    address is rewritten to the login page in next.config.ts, after this runs).
// 3. /admin: refresh the Supabase session cookie; signed-out visitors get a
//    404 (when the secret address is set) so the admin's existence isn't
//    revealed. Pages and actions still check roles themselves.
// The matcher keeps it off every other page, so public pages stay cached.
// verified: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_AI_BOTS, isBlockedAiBot, UNLISTED_PREFIX } from "@/lib/crawlers";
import { SUPABASE_CONFIGURED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";
import { secretLoginPath } from "@/lib/login-path";

const notFound = (request: NextRequest) =>
  NextResponse.rewrite(new URL("/_hidden-404", request.url), {
    status: 404,
    headers: { "X-Robots-Tag": "noindex", "Cache-Control": "private, no-store" },
  });

// The AI block list from admin settings, re-read at most every 5 minutes per
// server instance so landing pages don't wait on the database.
let bots: { list: readonly string[]; at: number } = { list: DEFAULT_AI_BOTS, at: 0 };
async function aiBots(): Promise<readonly string[]> {
  if (!SUPABASE_CONFIGURED || Date.now() - bots.at < 300_000) return bots.list;
  bots = { list: bots.list, at: Date.now() };
  const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data } = await sb.from("site_settings").select("data->aiBots").eq("id", true).maybeSingle();
  const list = (data as { aiBots?: unknown } | null)?.aiBots;
  if (Array.isArray(list) && list.every((t) => typeof t === "string")) bots = { list, at: Date.now() };
  return bots.list;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith(UNLISTED_PREFIX)) {
    if (isBlockedAiBot(request.headers.get("user-agent"), await aiBots())) {
      return new NextResponse("Forbidden", { status: 403, headers: { "X-Robots-Tag": "noindex, nofollow" } });
    }
    return NextResponse.next();
  }

  const loginPath = secretLoginPath();
  if (path === "/login" || path.startsWith("/login/")) return loginPath ? notFound(request) : NextResponse.next();

  // /admin from here on.
  if (!SUPABASE_CONFIGURED) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    if (loginPath) return notFound(request);
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    const redirect = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/lp/:path*", "/admin/:path*", "/admin", "/login", "/login/:path*"],
};
