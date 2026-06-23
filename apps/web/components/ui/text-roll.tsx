import React from "react";
import { cn } from "@/lib/utils";

export function TextRoll({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-flex flex-col overflow-hidden align-bottom", className)}>
      <span className="flex items-center gap-2 transition-transform duration-300 ease-[var(--ease-zap)] group-hover:-translate-y-full">
        {children}
      </span>
      <span className="absolute inset-0 flex items-center gap-2 translate-y-full transition-transform duration-300 ease-[var(--ease-zap)] group-hover:translate-y-0" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
