"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TerminalLine {
  text: string;
  color?: "default" | "muted" | "brand" | "success" | "warning";
  delay?: number;
}

const LINES: TerminalLine[] = [
  { text: "$ zap", delay: 300 },
  { text: "", delay: 200 },
  { text: "  ◆  zap  —  3 files changed on feat/login", color: "brand", delay: 350 },
  { text: "", delay: 100 },
  { text: "  M  src/auth/Login.jsx", color: "warning", delay: 120 },
  { text: "  A  src/auth/OTP.jsx", color: "success", delay: 120 },
  { text: "  D  src/auth/old.jsx", color: "muted", delay: 120 },
  { text: "", delay: 200 },
  { text: "  ○  Commit message", color: "brand", delay: 300 },
  { text: "  │  feat(auth): add OTP verification to login", color: "default", delay: 500 },
  { text: "", delay: 200 },
  { text: "  ◇  Pushing to feat/login...", color: "muted", delay: 700 },
  { text: "", delay: 300 },
  { text: "  ✓  Done in 1.2s", color: "success", delay: 200 },
  { text: "     → commit a3f91c2", color: "muted", delay: 120 },
  { text: "     → github.com/you/repo/commit/a3f91c2", color: "muted", delay: 120 },
];

const COLOR_CLASSES: Record<NonNullable<TerminalLine["color"]>, string> = {
  default: "text-fg",
  muted: "text-fg-subtle",
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
};

export function ZapTerminal({ className }: { className?: string }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= LINES.length) {
      const reset = setTimeout(() => setVisibleCount(0), 2600);
      return () => clearTimeout(reset);
    }
    const delay = LINES[visibleCount]?.delay ?? 150;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  return (
    <div
      className={cn(
        "w-full max-w-xl rounded-(--radius-card) border border-border bg-surface font-mono text-[13px] leading-relaxed shadow-none",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-2 text-xs text-fg-subtle">~/projects/repo</span>
      </div>
      <div className="min-h-[360px] p-4">
        <AnimatePresence initial={false}>
          {LINES.slice(0, visibleCount).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={cn("whitespace-pre", COLOR_CLASSES[line.color ?? "default"])}
            >
              {line.text || "\u00A0"}
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleCount < LINES.length && (
          <motion.span
            className="inline-block h-3.5 w-1.5 bg-brand"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
