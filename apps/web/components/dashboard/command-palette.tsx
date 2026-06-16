"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SquaresFour,
  ClockCounterClockwise,
  Sparkle,
  Gear,
  Copy,
} from "@phosphor-icons/react/dist/ssr";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCommandPalette } from "@/store/command-palette";

interface PaletteItem {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: (router: ReturnType<typeof useRouter>) => void;
}

const ITEMS: PaletteItem[] = [
  { label: "Overview", icon: <SquaresFour size={16} />, action: (r) => r.push("/dashboard") },
  { label: "Push history", icon: <ClockCounterClockwise size={16} />, action: (r) => r.push("/history") },
  { label: "AI usage", icon: <Sparkle size={16} />, action: (r) => r.push("/ai-usage") },
  { label: "Settings", icon: <Gear size={16} />, action: (r) => r.push("/settings") },
  {
    label: "Copy install command",
    hint: "npm install -g zap-git",
    icon: <Copy size={16} />,
    action: () => navigator.clipboard.writeText("npm install -g zap-git"),
  },
];

export function CommandPalette() {
  const { open, setOpen, toggle } = useCommandPalette();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[20%] max-w-md translate-y-0 p-2">
        <div className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.action(router);
                setOpen(false);
              }}
              className="flex items-center justify-between gap-3 rounded-(--radius-input) px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-elevated"
            >
              <span className="flex items-center gap-3">
                <span className="text-fg-muted">{item.icon}</span>
                {item.label}
              </span>
              {item.hint && <span className="font-mono text-xs text-fg-subtle">{item.hint}</span>}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
