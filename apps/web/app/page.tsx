import Link from "next/link";
import {
  Lightning,
  Sparkle,
  ArrowCounterClockwise,
  Eye,
  ShieldCheck,
  FileText,
  ChartBar,
  GithubLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { ZapTerminal } from "@/components/marketing/zap-terminal";
import { CommandCopyBlock } from "@/components/marketing/command-copy-block";
import { BentoGrid, BentoCard } from "@/components/marketing/bento-grid";
import { ZapLine } from "@/components/marketing/zap-mark";

const FEATURES = [
  {
    name: "AI commit messages",
    description:
      "zap --ai reads your diff and writes a Conventional Commits message with Groq AI. Accept, edit, or regenerate.",
    icon: <Sparkle size={18} weight="bold" />,
  },
  {
    name: "One-step undo",
    description:
      "zap --undo runs a soft reset — your last commit is gone, but your changes stay staged and safe.",
    icon: <ArrowCounterClockwise size={18} weight="bold" />,
  },
  {
    name: "Dry runs",
    description:
      "Preview the entire flow — files, commit message, checks — with zap --dry-run. Nothing is staged, committed, or pushed.",
    icon: <Eye size={18} weight="bold" />,
  },
  {
    name: "Pre-push checks",
    description:
      "zap --check runs your lint, test, and build scripts before pushing, and blocks the push if any of them fail.",
    icon: <ShieldCheck size={18} weight="bold" />,
  },
  {
    name: "Smart .gitignore",
    description:
      "zap detects your project type — Node, Next.js, Python, Django, Go, Rust, and more — and generates the right .gitignore automatically.",
    icon: <FileText size={18} weight="bold" />,
  },
  {
    name: "Push history & insights",
    description:
      "Every push syncs to your dashboard: commit history, AI usage, streaks, and a weekly activity chart across all your repos.",
    icon: <ChartBar size={18} weight="bold" />,
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
    description: "Sets up your git identity, remote, .gitignore, and (optionally) AI + dashboard sync.",
    command: "zap init",
  },
  {
    title: "Just type zap",
    description: "Stage, commit, and push — with a suggested message and a confirmation step.",
    command: "zap",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-20 pb-24">
          <div className="glow-brand pointer-events-none absolute -top-32 left-1/2 h-96 w-[640px] -translate-x-1/2" />
          <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-6">
              <span className="label-eyebrow inline-flex items-center gap-2 text-brand">
                <Lightning size={14} weight="fill" />
                Git push, reimagined
              </span>
              <h1 className="font-display text-5xl font-bold leading-[1.05] text-fg sm:text-6xl">
                Push code.
                <br />
                Just type <span className="text-brand">zap</span>.
              </h1>
              <p className="max-w-md text-lg text-fg-muted">
                One command replaces <code className="text-fg">git add</code>,{" "}
                <code className="text-fg">git commit</code>, and{" "}
                <code className="text-fg">git push</code> — with AI commit messages, main-branch
                guardrails, and instant undo.
              </p>

              <div className="flex flex-col gap-3 sm:max-w-sm">
                <CommandCopyBlock command="npm install -g zap-git" />
                <div className="flex items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/signup">Get started free</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="https://github.com" target="_blank" rel="noreferrer">
                      <GithubLogo size={18} />
                      Star on GitHub
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <ZapTerminal />
            </div>
          </div>
        </section>

        <ZapLine />

        {/* Features */}
        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
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
              {FEATURES.map((feature) => (
                <BentoCard key={feature.name} {...feature} />
              ))}
            </BentoGrid>
          </div>
        </section>

        <ZapLine />

        {/* How it works */}
        <section id="how-it-works" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex flex-col gap-3">
              <span className="label-eyebrow text-brand">How it works</span>
              <h2 className="font-display text-3xl font-bold text-fg sm:text-4xl">
                Three steps. Thirty seconds.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-6">
                  <span className="font-display text-3xl font-bold text-brand">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-lg font-semibold text-fg">{step.title}</h3>
                  <p className="text-sm text-fg-muted">{step.description}</p>
                  <CommandCopyBlock command={step.command} className="mt-auto" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-(--radius-card) border border-border bg-surface p-12 text-center">
            <span className="label-eyebrow text-brand">Ready when you are</span>
            <h2 className="font-display text-3xl font-bold text-fg sm:text-4xl">
              Stop typing the same three commands.
            </h2>
            <p className="max-w-md text-fg-muted">
              Install zap, run <code className="text-fg">zap init</code>, and your next push is one
              word away.
            </p>
            <div className="flex items-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Get started free</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
