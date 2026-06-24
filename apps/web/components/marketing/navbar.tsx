import Link from "next/link";
import Image from "next/image";
import { TextRoll } from "@/components/ui/text-roll";

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md uppercase text-[11px] tracking-[0.1em] font-medium text-fg-muted">
      <div className="w-full px-6">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-stretch border-b border-l border-r border-dashed border-white/10">
          <Link href="#features" className="group hidden md:flex items-center justify-start px-8 border-r border-border/50 border-dashed hover:text-fg transition-colors">
            <TextRoll>Features</TextRoll>
          </Link>
          <Link href="#how-it-works" className="group hidden md:flex items-center justify-center px-8 border-r border-border/50 border-dashed hover:text-fg transition-colors">
            <TextRoll>How it works</TextRoll>
          </Link>
          <Link href="/docs" className="group hidden md:flex items-center justify-center px-8 border-r border-border/50 border-dashed hover:text-fg transition-colors">
            <TextRoll>Docs</TextRoll>
          </Link>

          <div className="flex-1 flex items-center justify-center border-r border-border/50 border-dashed px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/zap.svg" alt="Zap Logo" width={28} height={28} />
              <span className="font-display text-2xl font-bold tracking-widest text-fg">ZAP</span>
            </Link>
          </div>

          <Link href="#pricing" className="group hidden md:flex items-center justify-center px-8 border-r border-border/50 border-dashed hover:text-fg transition-colors">
            <TextRoll>Pricing</TextRoll>
          </Link>
          <Link href="/login" className="group hidden md:flex items-center justify-center px-8 border-r border-border/50 border-dashed hover:text-fg transition-colors">
            <TextRoll>Sign In</TextRoll>
          </Link>
          <Link href="/signup" className="group hidden md:flex items-center justify-center px-8 hover:text-brand transition-colors">
            <TextRoll>Get Started</TextRoll>
          </Link>
        </div>
      </div>
    </header>
  );
}
