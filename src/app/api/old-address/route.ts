import type { NextRequest } from "next/server";
import { getRedirect } from "@/lib/landing-data";

// Addresses that match no page land here (a fallback rewrite in next.config.ts).
// A redirect saved in Admin → Redirects & ads sends the visitor on with a real
// 308, keeping the query (so ?gclid= survives). Anything else is the normal 404
// page. Real pages never reach this, so they stay cached.

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const from = `/${(searchParams.get("from") ?? "").replace(/^\/+|\/+$/g, "")}`;
  const to = (await getRedirect(from)) ?? (await getRedirect(`${from}/`));

  if (to && !to.startsWith("//")) {
    const target = new URL(to, origin);
    for (const [key, value] of searchParams) if (key !== "from") target.searchParams.append(key, value);
    return Response.redirect(target, 308);
  }

  const page = await fetch(new URL("/_hidden-404", origin), { cache: "no-store" });
  return new Response(page.body, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
  });
}

export const HEAD = GET;
