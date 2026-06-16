import { type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  /** Percentage change vs the previous period. Positive = up, negative = down. */
  change?: number;
  changeLabel?: string;
}

export function StatsCard({ label, value, icon, change, changeLabel }: StatsCardProps) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const isUp = hasChange && change! > 0;
  const isFlat = hasChange && change === 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-fg-muted">{label}</CardTitle>
        {icon && <span className="text-brand">{icon}</span>}
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold text-fg">{value}</p>
        {hasChange && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              isFlat ? "text-fg-subtle" : isUp ? "text-success" : "text-danger"
            )}
          >
            {!isFlat && (isUp ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />)}
            {Math.abs(change!)}% {changeLabel ?? "vs last week"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
