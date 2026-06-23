"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { AiUsagePoint } from "@/lib/data/ai-usage";

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { value: number }[];
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-(--radius-input) border border-border bg-surface-elevated px-3 py-2 text-xs shadow-none">
      <p className="mb-1 font-medium text-fg">{label}</p>
      <p className="text-fg-muted">{payload[0].value.toLocaleString()} tokens</p>
    </div>
  );
}

export function TokenUsageChart({ data }: { data: AiUsagePoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token usage</CardTitle>
        <CardDescription>Last 14 days</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#27272A" vertical={false} />
            <XAxis dataKey="date" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-elevated)" }} />
            <Bar dataKey="tokens" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
