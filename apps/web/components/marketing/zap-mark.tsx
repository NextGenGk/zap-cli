"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ZapMarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * The zap signature: a single-stroke lightning bolt that draws itself in on
 * mount and pulses with the brand glow. Used as the logo and as a loading /
 * "pushing" indicator throughout the dashboard.
 */
export function ZapMark({ size = 24, className, animated = true }: ZapMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand", className)}
      aria-hidden="true"
    >
      <motion.path
        d="M13 2 L4 13 H11 L10 22 L20 10 H13 L13 2 Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity={0.15}
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

/** A thin animated "electric line" used as a section divider / accent. */
export function ZapLine({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-px w-full overflow-hidden bg-border", className)}>
      <motion.div
        className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-brand to-transparent"
        animate={{ x: ["-6rem", "100%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }}
      />
    </div>
  );
}
