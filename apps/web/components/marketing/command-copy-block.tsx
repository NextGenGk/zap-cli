"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export function CommandCopyBlock({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — ignore silently.
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-(--radius-input) border border-border bg-surface px-4 py-2.5 font-mono text-sm text-fg transition-colors duration-200 hover:border-border-strong",
        className
      )}
      type="button"
    >
      <span className="truncate">
        <span className="text-fg-subtle">$ </span>
        {command}
      </span>
      {copied ? (
        <Check size={16} className="shrink-0 text-success" />
      ) : (
        <Copy size={16} className="shrink-0 text-fg-subtle transition-colors group-hover:text-fg" />
      )}
    </button>
  );
}
