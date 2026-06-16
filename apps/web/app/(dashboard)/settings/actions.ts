"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CheckMode } from "@/lib/supabase/types";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function updatePreferences(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not signed in." };

  const checkMode = String(formData.get("check_mode") ?? "ask") as CheckMode;
  const aiDefault = formData.get("ai_default") === "on";
  const warnMain = formData.get("warn_main") === "on";

  if (!["always", "never", "ask"].includes(checkMode)) {
    return { error: "Invalid check mode." };
  }

  // Mutations go through the admin client (service role), scoped manually to
  // the authenticated user's id -- avoids RLS write policies for app-managed
  // settings while still requiring a valid session above.
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_settings")
    .update({ check_mode: checkMode, ai_default: aiDefault, warn_main: warnMain, updated_at: new Date().toISOString() })
    .eq("user_id", userData.user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export interface CreateApiKeyResult extends ActionResult {
  rawKey?: string;
  label?: string;
}

/** Generates a new CLI API key. The raw key is returned ONCE and never stored. */
export async function createApiKey(formData: FormData): Promise<CreateApiKeyResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not signed in." };

  const label = String(formData.get("label") ?? "CLI key").trim() || "CLI key";

  const rawKey = `zap_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const admin = createAdminClient();
  const { error } = await admin.from("api_keys").insert({
    user_id: userData.user.id,
    key_hash: keyHash,
    label,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true, rawKey, label };
}

export async function revokeApiKey(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing key id." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
