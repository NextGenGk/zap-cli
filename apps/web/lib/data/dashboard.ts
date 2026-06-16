import type { PushEventRow } from "@/lib/supabase/types";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { ActivityPoint } from "@/components/dashboard/activity-chart";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getRecentPushEvents(
  supabase: TypedSupabaseClient,
  userId: string,
  limit = 20
): Promise<PushEventRow[]> {
  const { data, error } = await supabase
    .from("push_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentPushEvents", error.message);
    return [];
  }
  return (data ?? []) as PushEventRow[];
}

export interface DashboardStats {
  totalPushes: number;
  pushesThisWeek: number;
  weekChangePct: number;
  aiPercentage: number;
  currentStreakDays: number;
  totalTokens: number;
}

export async function getDashboardStats(supabase: TypedSupabaseClient, userId: string): Promise<DashboardStats> {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString();
  const twoWeeksAgo = new Date(now - 14 * DAY_MS).toISOString();

  const [{ count: totalPushes }, { data: lastTwoWeeks }, { data: aiUsage }] = await Promise.all([
    supabase.from("push_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("undone", false),
    supabase
      .from("push_events")
      .select("created_at, used_ai")
      .eq("user_id", userId)
      .eq("undone", false)
      .gte("created_at", twoWeeksAgo),
    supabase.from("ai_usage").select("tokens_used").eq("user_id", userId),
  ]);

  const rows = (lastTwoWeeks ?? []) as { created_at: string; used_ai: boolean }[];
  const thisWeek = rows.filter((r) => r.created_at >= weekAgo);
  const lastWeek = rows.filter((r) => r.created_at < weekAgo);

  const pushesThisWeek = thisWeek.length;
  const pushesLastWeek = lastWeek.length;
  const weekChangePct =
    pushesLastWeek === 0
      ? pushesThisWeek > 0
        ? 100
        : 0
      : Math.round(((pushesThisWeek - pushesLastWeek) / pushesLastWeek) * 100);

  const aiCount = thisWeek.filter((r) => r.used_ai).length;
  const aiPercentage = pushesThisWeek === 0 ? 0 : Math.round((aiCount / pushesThisWeek) * 100);

  const totalTokens = ((aiUsage ?? []) as { tokens_used: number }[]).reduce((sum, r) => sum + (r.tokens_used ?? 0), 0);

  const currentStreakDays = await computeStreak(supabase, userId);

  return {
    totalPushes: totalPushes ?? 0,
    pushesThisWeek,
    weekChangePct,
    aiPercentage,
    currentStreakDays,
    totalTokens,
  };
}

/** Counts consecutive days (including today) with at least one push. */
async function computeStreak(supabase: TypedSupabaseClient, userId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * DAY_MS).toISOString();
  const { data } = await supabase
    .from("push_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("undone", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const days = new Set(((data ?? []) as { created_at: string }[]).map((r) => r.created_at.slice(0, 10)));

  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) {
      // Allow today to be missing without breaking the streak (it's not over yet)
      if (streak === 0 && key === new Date().toISOString().slice(0, 10)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getActivityChartData(supabase: TypedSupabaseClient, userId: string): Promise<ActivityPoint[]> {
  const since = new Date(Date.now() - 13 * DAY_MS).toISOString();
  const { data } = await supabase
    .from("push_events")
    .select("created_at, used_ai")
    .eq("user_id", userId)
    .eq("undone", false)
    .gte("created_at", since);

  const rows = (data ?? []) as { created_at: string; used_ai: boolean }[];

  const buckets = new Map<string, { pushes: number; aiPushes: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    buckets.set(d.toISOString().slice(0, 10), { pushes: 0, aiPushes: 0 });
  }

  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.pushes += 1;
    if (row.used_ai) bucket.aiPushes += 1;
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    date: new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    pushes: value.pushes,
    aiPushes: value.aiPushes,
  }));
}
