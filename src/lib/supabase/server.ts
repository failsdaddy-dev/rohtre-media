import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../env";

// Per-request client that acts as the signed-in user (RLS applies).
// connection(): session work only runs for a real request, never during a
// prerender, so signed-in data is never cached ahead of the user.
// Pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
export async function supabaseServer() {
  await connection();
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          /* called from a Server Component: the proxy refreshes the session instead */
        }
      },
    },
  });
}
