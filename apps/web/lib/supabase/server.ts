import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes the user's auth cookies so RLS-aware
 * queries run as the signed-in user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component without a writable cookie jar.
            // The middleware below refreshes the session instead.
          }
        },
      },
    }
  );
}

/**
 * The exact type returned by `createClient()`. Use this (instead of
 * re-constructing `SupabaseClient<Database, ...>`) in helper function
 * signatures to avoid generic-parameter mismatches between @supabase/ssr
 * and @supabase/supabase-js versions.
 */
export type TypedSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Admin client using the service role key. Bypasses RLS entirely — only
 * use in trusted server contexts (e.g. the `/api/push-events` route, after
 * validating the caller's API key against `api_keys`).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
