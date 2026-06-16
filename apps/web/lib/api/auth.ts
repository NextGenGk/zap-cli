import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export interface AuthenticatedRequest {
  userId: string;
  apiKeyId: string;
}

/**
 * Validates the `Authorization: Bearer <key>` header against `api_keys`
 * (by SHA-256 hash, never the raw key). Returns the owning user's id, or
 * `null` if the key is missing, unknown, or revoked.
 *
 * Uses the service-role client because the CLI has no Supabase session —
 * RLS is enforced manually here by scoping all subsequent queries to
 * `userId`.
 */
export async function authenticateApiKey(request: Request): Promise<AuthenticatedRequest | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const rawKey = match[1].trim();
  if (!rawKey) return null;

  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;

  // Best-effort last_used_at bump — don't block the request on it.
  void supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  return { userId: data.user_id, apiKeyId: data.id };
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
}
