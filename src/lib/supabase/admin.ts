import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../env";
import { supabaseSecretKey } from "../env.server";

// Secret-key client: bypasses RLS. Use only in server code that has already
// checked who is calling (lead intake, publish, Cloudinary clean-up).
export function supabaseAdmin(): SupabaseClient | null {
  const key = supabaseSecretKey();
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
