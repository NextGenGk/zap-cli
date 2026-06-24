"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  ClockCounterClockwise,
  Sparkle,
  Gear,
  SignOut,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: SquaresFour },
  { href: "/history", label: "Push history", icon: ClockCounterClockwise },
  { href: "/ai-usage", label: "AI usage", icon: Sparkle },
  { href: "/settings", label: "Settings", icon: Gear },
];

export function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen shrink-0 w-60 flex-col border-r border-border bg-surface px-4 py-5">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
        <Image src="/zap.svg" alt="Zap Logo" width={28} height={28} />
        <span className="font-display text-2xl font-bold tracking-widest text-fg">ZAP</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
