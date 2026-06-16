import Link from "next/link";
import { ZapMark } from "./zap-mark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <ZapMark size={18} animated={false} />
          <span className="font-display text-sm font-semibold text-fg">zap</span>
          <span className="text-sm text-fg-subtle">— push code, just type zap.</span>
        </div>
        <nav className="flex flex-wrap items-center gap-6 text-sm text-fg-muted">
          <Link href="#features" className="hover:text-fg">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-fg">
            How it works
          </Link>
          <Link href="/login" className="hover:text-fg">
            Sign in
          </Link>
          <Link href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-fg">
            GitHub
          </Link>
        </nav>
      </div>
    </footer>
  );
}
