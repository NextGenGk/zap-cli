import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the public anon key — all access is
 * governed by RLS policies (see /supabase/schema.sql). Table row shapes are
 * enforced via the TypeScript interfaces in ./types rather than the
 * generic Database parameter (see server.ts for why).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
