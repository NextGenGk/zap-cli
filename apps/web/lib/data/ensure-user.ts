import { createAdminClient } from "@/lib/supabase/server";

/**
 * Ensures `public.users` and `public.user_settings` rows exist for the
 * given auth user.
 *
 * The schema's `on_auth_user_created` trigger normally creates these on
 * signup, but this is called as a safety net on every dashboard load and
 * after the auth callback, because:
 *  - users created before the trigger existed won't have these rows
 *  - any other gap between auth.users and public.users would otherwise
 *    cause every later insert that has a `references public.users(id)`
 *    foreign key (e.g. `api_keys`, `push_events`) to fail
 *
 * Uses `upsert` with `ignoreDuplicates` so it's a cheap no-op for users
 * that already have these rows.
 */
export async function ensureUserRecord(userId: string, email?: string | null): Promise<void> {
  const admin = createAdminClient();

  await admin
    .from("users")
    .upsert({ id: userId, email: email ?? null }, { onConflict: "id", ignoreDuplicates: true });

  await admin
    .from("user_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
}
