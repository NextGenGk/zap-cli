import Link from "next/link";
import {
  Lightning,
  Sparkle,
  ArrowCounterClockwise,
  ShieldCheck,
  FileText,
  ChartBar,
  FolderSimplePlus,
} from "@phosphor-icons/react/dist/ssr";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { ZapTerminal } from "@/components/marketing/zap-terminal";
import { CommandCopyBlock } from "@/components/marketing/command-copy-block";
import { BentoGrid, BentoCard } from "@/components/marketing/bento-grid";
import {
  AI_COMMIT_VISUAL,
  GIT_INIT_VISUAL,
  UNDO_VISUAL,
  CHECKS_VISUAL,
  GITIGNORE_VISUAL,
  DASHBOARD_VISUAL,
} from "@/components/marketing/feature-visuals";
import { TextRoll } from "@/components/ui/text-roll";

const FEATURES = [
  {
    name: "AI commit messages",
    description:
      "Reads your full repo context — file tree, package.json, README — and writes accurate Conventional Commits with AI. Accept, edit, or regenerate.",
    icon: <Sparkle size={18} weight="bold" />,
    visual: AI_COMMIT_VISUAL,
  },
  {
    name: "Auto git init",
    description:
      "Run zap init in any folder — it creates the git repo, sets up your identity, generates .gitignore, and connects to your dashboard in one flow.",
    icon: <FolderSimplePlus size={18} weight="bold" />,
    visual: GIT_INIT_VISUAL,
  },
  {
    name: "One-step undo",
    description:
      "zap --undo soft-resets your last commit keeping your changes staged. Safe, instant, no force push needed.",
    icon: <ArrowCounterClockwise size={18} weight="bold" />,
    visual: UNDO_VISUAL,
  },
  {
    name: "Pre-push checks",
    description:
      "Run lint, test, and build scripts before every push. Configure always, never, or ask each time. Block pushes that break your pipeline.",
    icon: <ShieldCheck size={18} weight="bold" />,
    visual: CHECKS_VISUAL,
  },
  {
    name: "Smart .gitignore",
    description:
      "Auto-detects Node, Next.js, React, Python, Django, Go, Rust, and more — generates the right .gitignore automatically. Never commit node_modules again.",
    icon: <FileText size={18} weight="bold" />,
    visual: GITIGNORE_VISUAL,
  },
  {
    name: "Dashboard & insights",
    description:
      "Push history, AI token usage, weekly activity chart, and streak tracking across all your repos. Supports multiple dashboards with easy reconnect.",
    icon: <ChartBar size={18} weight="bold" />,
    visual: DASHBOARD_VISUAL,
  },
];

const STEPS = [
  {
    title: "Install zap",
    description: "One command, works with any git repo on macOS, Linux, or Windows.",
    command: "npm install -g zap-git",
  },
  {
    title: "Run zap init",
    description: "Auto-initializes git, sets up your identity, generates .gitignore, and connects to your dashboard — all in one flow. Switch dashboards anytime by re-running zap init.",
    command: "zap init",
  },
  {
    title: "Push with AI",
    description: "zap --ai analyzes your full repo context and generates a Conventional Commits message. Accept, edit with AI assistance, or write your own.",
    command: "zap --ai",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-20 pb-24">

          <div className="relative mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2 lg:items-center px-8">
            <div className="flex flex-col gap-6">
              <span className="w-fit text-[13px] font-bold tracking-[0.15em] text-brand uppercase inline-flex items-center gap-2 border border-dashed border-brand/30 rounded-full px-4 py-1.5">
                <Lightning size={14} weight="fill" />
                Git push, reimagined
              </span>
              <h1 className="font-display text-[50px] font-bold leading-[1.1] text-fg sm:text-[60px] uppercase tracking-wide">
                Push code.
                <br />
                Just type <span className="text-brand">zap</span>.
              </h1>
              <p className="max-w-lg text-[16px] text-fg-muted leading-relaxed">
                One command replaces <code className="text-fg">git add</code>,{" "}
                <code className="text-fg">git commit</code>, and{" "}
                <code className="text-fg">git push</code> — with AI commit messages,
                auto git init, main-branch guardrails, and instant undo.
              </p>

              <div className="mt-4 flex flex-col gap-10 w-full max-w-fit">
                <CommandCopyBlock command="npm install -g zap-git" />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/signup" className="inline-flex items-center justify-center h-11 px-6 border border-dashed border-brand/40 rounded-xl bg-gradient-to-r from-brand/10 to-brand/5 hover:from-brand/15 hover:to-brand/10 transition-all text-brand uppercase tracking-widest text-[13px] font-medium whitespace-nowrap">
                    <TextRoll>Get Started Free</TextRoll>
                  </Link>
                  <Link href="/docs" className="inline-flex items-center justify-center h-11 px-6 border border-dashed border-white/15 rounded-xl hover:bg-surface/50 transition-colors text-fg uppercase tracking-widest text-[13px] font-medium whitespace-nowrap" style={{ borderStyle: 'dashed' }}>
                    <TextRoll>Read the docs</TextRoll>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <ZapTerminal />
            </div>
          </div>
        </section>

        <div className="border-t border-dashed border-white/10 mx-auto max-w-[1200px] px-8" />

        {/* Features */}
        <section id="features" className="relative overflow-hidden px-6 py-24">
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mb-12 flex flex-col gap-3">
              <span className="label-eyebrow text-brand">Features</span>
              <h2 className="font-display text-3xl font-bold text-fg sm:text-4xl">
                Everything your push workflow was missing
              </h2>
              <p className="max-w-2xl text-fg-muted">
                zap isn&apos;t a git alias. It&apos;s a small, opinionated layer that makes the most
                common git operation — pushing your work — fast, safe, and a little bit smarter.
              </p>
            </div>

            <BentoGrid>
              {FEATURES.map((feature, index) => (
                <BentoCard 
                  key={feature.name} 
                  {...feature} 
                  className={index === 0 || index === 5 ? "md:col-span-2 lg:col-span-2" : "md:col-span-1 lg:col-span-1"}
                />
              ))}
            </BentoGrid>
          </div>
        </section>

        <div className="border-t border-dashed border-white/10 mx-auto max-w-[1200px] px-8" />

        {/* How it works */}
        <section id="how-it-works" className="relative overflow-hidden px-6 py-24">
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="mb-12 flex flex-col gap-3">
              <span className="label-eyebrow text-brand">How it works</span>
              <h2 className="font-display text-3xl font-bold text-fg sm:text-4xl">
                Three steps. Thirty seconds.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="relative overflow-hidden flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-6">
                  <div 
                    className="absolute inset-0 opacity-[0.03]" 
                    style={{ 
                      backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', 
                      backgroundSize: '24px 24px' 
                    }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/10 to-transparent" />
                  
                  <div className="relative z-10 flex flex-col gap-4 h-full">
                    <span className="font-display text-3xl font-bold text-brand">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="text-lg font-semibold text-fg">{step.title}</h3>
                    <p className="text-sm text-fg-muted">{step.description}</p>
                    <CommandCopyBlock command={step.command} className="mt-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="border-t border-dashed border-white/10 mx-auto max-w-[1200px] px-8" />

        {/* CTA */}
        <section className="relative overflow-hidden px-6 py-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 rounded-2xl border border-brand/15 bg-gradient-to-b from-brand/5 via-surface/60 to-surface/30 p-14 text-center relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-[0.03]" 
              style={{ 
                backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', 
                backgroundSize: '24px 24px' 
              }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/10 to-transparent" />
            
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-40 glow-brand" />
            <span className="relative z-10 label-eyebrow text-brand">Ready when you are</span>
            <h2 className="font-display text-4xl font-bold text-fg sm:text-5xl tracking-tight">
              Ship faster.{" "}
              <span className="text-brand">Type less.</span>
            </h2>
            <p className="max-w-lg text-[15px] text-fg-muted leading-relaxed">
              Install zap, run <code className="text-fg">zap init</code>, and push your next change
              with an AI-generated commit message in one word.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="inline-flex items-center justify-center h-11 px-6 border border-dashed border-brand/40 rounded-xl bg-gradient-to-r from-brand/10 to-brand/5 hover:from-brand/15 hover:to-brand/10 transition-all text-brand uppercase tracking-widest text-[13px] font-medium whitespace-nowrap">
                <TextRoll>Get Started Free</TextRoll>
              </Link>
              <Link href="/docs" className="inline-flex items-center justify-center h-11 px-6 border border-dashed border-white/15 rounded-xl bg-surface hover:bg-surface/80 transition-colors text-fg uppercase tracking-widest text-[13px] font-medium whitespace-nowrap" style={{ borderStyle: 'dashed' }}>
                <TextRoll>Read the docs</TextRoll>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
