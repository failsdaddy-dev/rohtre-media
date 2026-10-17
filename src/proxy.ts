// Runs before matching requests (Next.js 16 "proxy", formerly middleware).
// 1. Unlisted landing pages: refuse known AI crawlers with 403 (R42, second
//    layer after robots.txt). Ad-review bots always pass.
// 2. /admin: refresh the Supabase session cookie and send signed-out visitors
//    to /login. Pages and actions still check roles themselves; this is only
//    the fast first gate.
// The matcher keeps it off every other page, so public pages stay cached.
// verified: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isBlockedAiBot, UNLISTED_PREFIX } from "@/lib/crawlers";
import { SUPABASE_CONFIGURED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith(UNLISTED_PREFIX)) {
    if (isBlockedAiBot(request.headers.get("user-agent"))) {
      return new NextResponse("Forbidden", { status: 403, headers: { "X-Robots-Tag": "noindex, nofollow" } });
    }
    return NextResponse.next();
  }

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
  matcher: ["/lp/:path*", "/admin/:path*", "/admin"],
};
