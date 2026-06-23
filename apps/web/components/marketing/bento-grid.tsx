import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn("grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>
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
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface/40 p-6 transition-colors duration-300 hover:border-brand/50",
        className
      )}
    >
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/10 to-transparent" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="text-fg-muted group-hover:text-fg transition-colors">
            {icon}
          </div>
          <h3 className="text-[15px] font-semibold text-fg tracking-wide">{name}</h3>
        </div>
        <p className="text-[14px] text-fg-muted leading-relaxed">{description}</p>
      </div>
      {visual && <div className="relative z-10 mt-6 flex-1 flex flex-col">{visual}</div>}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 glow-brand" />
    </div>
  );
}
