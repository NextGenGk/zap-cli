import Link from "next/link";
import { ZapMark } from "./zap-mark";
import { Button } from "@/components/ui/button";

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <ZapMark size={20} animated={false} />
          <span className="font-display text-lg font-bold text-fg">zap</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="zap-underline text-sm text-fg-muted hover:text-fg">
            Features
          </Link>
          <Link href="#how-it-works" className="zap-underline text-sm text-fg-muted hover:text-fg">
            How it works
          </Link>
          <Link
            href="https://github.com"
            className="zap-underline text-sm text-fg-muted hover:text-fg"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
