import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, SUPABASE_CONFIGURED } from "../env";

// Cookie-less client for public, cacheable reads (published content,
// settings). Acts as `anon`, so RLS only lets it see public rows.
export function supabasePublic() {
  if (!SUPABASE_CONFIGURED) return null;
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
