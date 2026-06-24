import Link from "next/link";
import { Lightning, ClockCounterClockwise, Sparkle, Flame, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getRecentPushEvents, getDashboardStats, getActivityChartData } from "@/lib/data/dashboard";
import { Topbar } from "@/components/dashboard/topbar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { PushTable } from "@/components/dashboard/push-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const [events, stats, chartData, { count: apiKeyCount }] = await Promise.all([
    getRecentPushEvents(supabase, userId, 6),
    getDashboardStats(supabase, userId),
    getActivityChartData(supabase, userId),
    supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("user_id", userId).is("revoked_at", null),
  ]);

  const isConnected = (apiKeyCount ?? 0) > 0;

  return (
    <div className="flex flex-col">
      <Topbar title="Overview" description="Your push activity across all connected repos." />

      <div className="flex flex-col gap-6 p-4 sm:p-8">
        {!isConnected && (
          <Card className="border-brand/30 bg-brand/5">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <Lightning size={20} weight="fill" className="text-brand" />
                <div>
                  <p className="text-sm font-medium text-fg">Connect the zap CLI to start tracking pushes</p>
                  <p className="text-sm text-fg-muted">Generate an API key and run <code className="text-fg">zap init</code> in your repo.</p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href="/settings">
                  Go to settings <ArrowRight size={14} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total pushes" value={String(stats.totalPushes)} icon={<Lightning size={16} weight="fill" />} />
          <StatsCard
            label="This week"
            value={String(stats.pushesThisWeek)}
            change={stats.weekChangePct}
            icon={<ClockCounterClockwise size={16} />}
          />
          <StatsCard label="AI-assisted" value={`${stats.aiPercentage}%`} icon={<Sparkle size={16} weight="fill" />} changeLabel="of this week's pushes" change={undefined} />
          <StatsCard label="Current streak" value={`${stats.currentStreakDays} day${stats.currentStreakDays === 1 ? "" : "s"}`} icon={<Flame size={16} weight="fill" />} />
        </div>

        <ActivityChart data={chartData} />

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent pushes</CardTitle>
              <CardDescription>Your latest activity</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/history">
                View all <ArrowRight size={14} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <PushTable events={events} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
