import type { AiUsageRow, PushEventRow } from "@/lib/supabase/types";
import type { TypedSupabaseClient } from "@/lib/supabase/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AiUsageStats {
  totalTokens: number;
  totalAiPushes: number;
  totalPushes: number;
  aiPercentage: number;
  estimatedTimeSavedMin: number;
}

const AVG_SECONDS_SAVED_PER_AI_COMMIT = 90;

export async function getAiUsageStats(supabase: TypedSupabaseClient, userId: string): Promise<AiUsageStats> {
  const [{ data: usage }, { count: totalAiPushes }, { count: totalPushes }] = await Promise.all([
    supabase.from("ai_usage").select("tokens_used"),
    supabase.from("push_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("used_ai", true),
    supabase.from("push_events").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const totalTokens = ((usage ?? []) as AiUsageRow[]).reduce((sum, r) => sum + (r.tokens_used ?? 0), 0);
  const aiPushes = totalAiPushes ?? 0;
  const allPushes = totalPushes ?? 0;

  return {
    totalTokens,
    totalAiPushes: aiPushes,
    totalPushes: allPushes,
    aiPercentage: allPushes === 0 ? 0 : Math.round((aiPushes / allPushes) * 100),
    estimatedTimeSavedMin: Math.round((aiPushes * AVG_SECONDS_SAVED_PER_AI_COMMIT) / 60),
  };
}

export interface AiUsagePoint {
  date: string;
  tokens: number;
}

export async function getAiUsageChartData(supabase: TypedSupabaseClient, userId: string): Promise<AiUsagePoint[]> {
  const since = new Date(Date.now() - 13 * DAY_MS).toISOString();
  const { data } = await supabase
    .from("ai_usage")
    .select("created_at, tokens_used")
    .eq("user_id", userId)
    .gte("created_at", since);

  const rows = (data ?? []) as { created_at: string; tokens_used: number }[];

  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + (row.tokens_used ?? 0));
    }
  }

  return Array.from(buckets.entries()).map(([key, tokens]) => ({
    date: new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    tokens,
  }));
}

export async function getAiAssistedPushes(supabase: TypedSupabaseClient, userId: string, limit = 10): Promise<PushEventRow[]> {
  const { data } = await supabase
    .from("push_events")
    .select("*")
    .eq("user_id", userId)
    .eq("used_ai", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as PushEventRow[];
}
