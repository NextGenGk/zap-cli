"use client";

import { List } from "@phosphor-icons/react/dist/ssr";
import { useSidebar } from "@/store/sidebar";

export function SidebarToggle() {
  const { toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="flex lg:hidden items-center justify-center h-9 w-9 rounded-(--radius-input) text-fg-muted hover:bg-surface hover:text-fg transition-colors absolute top-4 left-4 z-30"
      aria-label="Open sidebar"
    >
      <List size={20} />
    </button>
  );
}
