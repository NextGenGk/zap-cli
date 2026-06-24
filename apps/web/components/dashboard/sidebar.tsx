"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  ClockCounterClockwise,
  Sparkle,
  Gear,
  BookOpen,
  SignOut,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { useSidebar } from "@/store/sidebar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: SquaresFour },
  { href: "/history", label: "Push history", icon: ClockCounterClockwise },
  { href: "/ai-usage", label: "AI usage", icon: Sparkle },
  { href: "/docs", label: "Docs", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Gear },
];

export function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  const nav = (
    <>
      <div className="flex items-center justify-between px-2 mb-8">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/zap.svg" alt="Zap Logo" width={28} height={28} />
          <span className="font-display text-2xl font-bold tracking-widest text-fg">ZAP</span>
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="flex lg:hidden items-center justify-center text-fg-muted hover:text-fg transition-colors"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-(--radius-input) px-3 py-2 text-sm font-medium transition-colors duration-200",
                active ? "bg-surface-elevated text-fg" : "text-fg-muted hover:bg-surface-elevated/60 hover:text-fg"
              )}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} className={active ? "text-brand" : undefined} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        {email && <p className="truncate px-3 text-xs text-fg-subtle">{email}</p>}

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-(--radius-input) px-3 py-2 text-sm font-medium text-fg-muted transition-colors duration-200 hover:bg-surface-elevated/60 hover:text-fg"
          >
            <SignOut size={18} />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen shrink-0 w-60 flex-col border-r border-border bg-surface px-4 py-5">
        {nav}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-60 h-full bg-surface border-r border-border px-4 py-5 flex flex-col overflow-y-auto">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
