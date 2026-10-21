import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { secretLoginPath } from "@/lib/login-path";
import { supabaseServer } from "@/lib/supabase/server";

// POST only, so a link on another site can't sign someone out.
export async function POST(request: NextRequest) {
  if (SUPABASE_CONFIGURED) {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  }
  return NextResponse.redirect(new URL(secretLoginPath() ?? "/login", request.url), { status: 303 });
}
