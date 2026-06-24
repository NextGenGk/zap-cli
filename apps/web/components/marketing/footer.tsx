import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Pages: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "/docs" },
  ],
  Connect: [
    { label: "GitHub", href: "https://github.com/NextGenGk" },
    { label: "Twitter", href: "https://x.com/gauravkumar1697" },
  ],
  Account: [
    { label: "Sign in", href: "/login" },
    { label: "Get started", href: "/signup" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="">
      <div className="relative">

        <div className="mx-auto max-w-[1200px] px-8 py-16 border-t border-dashed border-border/50">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2.5 text-fg">
                <Image src="/zap.svg" alt="Zap Logo" width={28} height={28} />
                <span className="font-display text-2xl font-bold tracking-widest">ZAP</span>
              </Link>
              <p className="text-sm text-fg-muted leading-relaxed max-w-xs">
                One command replaces git add, git commit, and git push — with AI commit messages, auto git init, and instant undo.
              </p>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="flex flex-col gap-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                  {title}
                </span>
                <nav className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-2 px-8 py-6 sm:flex-row sm:justify-between border-y border-dashed border-border/50">
            <p className="text-xs text-fg-subtle">
              &copy; {new Date().getFullYear()} Zap. All rights reserved.
            </p>
            <p className="text-xs text-fg-subtle">
              Push code. Just type Zap.
            </p>
          </div>
      </div>
    </footer>
  );
}
