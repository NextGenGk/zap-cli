"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { TextRoll } from "@/components/ui/text-roll";

const MOBILE_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/docs", label: "Docs" },
  { href: "#pricing", label: "Pricing" },
  { href: "/login", label: "Sign In" },
  { href: "/signup", label: "Get Started" },
];

export function MarketingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
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

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex md:hidden items-center justify-center px-4 text-fg-muted hover:text-fg transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-b border-dashed border-white/10 bg-canvas/95 backdrop-blur-md">
          <div className="mx-auto max-w-[1200px] flex flex-col px-6 py-4 gap-1">
            {MOBILE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-4 py-3 text-sm text-fg-muted hover:bg-surface hover:text-fg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
