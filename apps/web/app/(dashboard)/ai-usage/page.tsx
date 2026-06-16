import { Sparkle, Coins, Lightning, Clock } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getAiUsageStats, getAiUsageChartData, getAiAssistedPushes } from "@/lib/data/ai-usage";
import { Topbar } from "@/components/dashboard/topbar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TokenUsageChart } from "@/components/dashboard/token-usage-chart";
import { PushTable } from "@/components/dashboard/push-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export default async function AiUsagePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const [stats, chartData, recentAiPushes] = await Promise.all([
    getAiUsageStats(supabase, userId),
    getAiUsageChartData(supabase, userId),
    getAiAssistedPushes(supabase, userId, 8),
  ]);

  return (
    <div className="flex flex-col">
      <Topbar title="AI usage" description="How much zap --ai has done for you, powered by Groq (openai/gpt-oss-120b)." />

      <div className="flex flex-col gap-6 p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="AI-assisted pushes" value={String(stats.totalAiPushes)} icon={<Sparkle size={16} weight="fill" />} />
          <StatsCard label="Total tokens" value={formatNumber(stats.totalTokens)} icon={<Coins size={16} weight="fill" />} />
          <StatsCard label="Of all pushes" value={`${stats.aiPercentage}%`} icon={<Lightning size={16} weight="fill" />} />
          <StatsCard label="Est. time saved" value={`${stats.estimatedTimeSavedMin} min`} icon={<Clock size={16} weight="fill" />} />
        </div>

        <TokenUsageChart data={chartData} />

        <Card>
          <CardHeader>
            <CardTitle>Recent AI-generated commits</CardTitle>
            <CardDescription>Messages written by Groq from your diffs</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <PushTable
              events={recentAiPushes}
              emptyState={
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <p className="text-sm font-medium text-fg">No AI-assisted pushes yet</p>
                  <p className="max-w-xs text-sm text-fg-muted">
                    Run <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs text-fg">zap --ai</code> to
                    generate a commit message from your diff.
                  </p>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
