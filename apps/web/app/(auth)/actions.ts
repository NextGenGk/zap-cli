"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/data/ensure-user";
import { getAppUrl } from "@/lib/utils";

export interface AuthResult {
  error?: string;
  /** Set when signup succeeded but requires email confirmation (no session yet). */
  message?: string;
}

export async function signInWithPassword(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  if (data.user) {
    await ensureUserRecord(data.user.id, data.user.email);
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? getAppUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });

  if (error) return { error: error.message };

  // If the project doesn't require email confirmation, signUp returns a
  // session immediately and we can go straight to onboarding. Otherwise,
  // there's no session yet — redirecting to a protected route would just
  // bounce back to /login, so show a "check your email" message instead.
  if (data.session && data.user) {
    await ensureUserRecord(data.user.id, data.user.email);
    redirect("/onboarding");
  }

  return { message: "Check your email for a confirmation link, then sign in." };
}

export async function signInWithGithub(): Promise<void> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? getAppUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${origin}/auth/callback?next=/onboarding` },
  });

  if (error || !data?.url) {
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? getAppUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/onboarding` },
  });

  if (error || !data?.url) {
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
