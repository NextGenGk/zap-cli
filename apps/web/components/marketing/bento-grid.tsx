import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn("grid w-full grid-cols-1 gap-4 md:grid-cols-3", className)}>{children}</div>
  );
}

interface BentoCardProps {
  name: string;
  description: string;
  icon: ReactNode;
  visual?: ReactNode;
  className?: string;
}

export function BentoCard({ name, description, icon, visual, className }: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-(--radius-card) border border-border bg-surface p-6 transition-colors duration-200 hover:border-border-strong",
        className
      )}
    >
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-(--radius-input) border border-border bg-surface-elevated text-brand">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-fg">{name}</h3>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      {visual && <div className="relative z-10 mt-6">{visual}</div>}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 glow-brand" />
    </div>
  );
}
