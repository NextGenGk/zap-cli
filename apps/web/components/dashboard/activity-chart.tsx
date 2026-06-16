"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface ActivityPoint {
  date: string; // "Mon", "Tue", ... or "Jan 1"
  pushes: number;
  aiPushes: number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; name: string; value: number; color: string }[];
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-(--radius-input) border border-border bg-surface-elevated px-3 py-2 text-xs shadow-none">
      <p className="mb-1 font-medium text-fg">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-fg-muted">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Push activity</CardTitle>
        <CardDescription>Last 14 days</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="pushGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6EE7B7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272A" vertical={false} />
            <XAxis dataKey="date" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="pushes"
              name="Pushes"
              stroke="#6EE7B7"
              fill="url(#pushGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="aiPushes"
              name="AI-assisted"
              stroke="#60A5FA"
              fill="url(#aiGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
