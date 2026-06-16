import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/data/ensure-user";

/**
 * GET /auth/callback — the redirect target for both:
 *  - Email confirmation links (`emailRedirectTo` on signUp)
 *  - GitHub OAuth (`redirectTo` on signInWithOAuth)
 *
 * Supabase redirects here with a `code` query param (PKCE flow). We
 * exchange it for a session, make sure the user has a `public.users` /
 * `public.user_settings` row (belt-and-suspenders alongside the
 * `on_auth_user_created` trigger), then send the user on to `next`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await ensureUserRecord(data.user.id, data.user.email);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-code-error", url.origin));
}
