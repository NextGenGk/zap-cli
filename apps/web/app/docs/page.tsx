"use client";

import { useEffect, useState } from "react";
import {
  Lightning,
  Sparkle,
  FolderSimplePlus,
  ArrowCounterClockwise,
  ShieldCheck,
  FileText,
  ClockCounterClockwise,
  Terminal,
} from "@phosphor-icons/react/dist/ssr";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { CommandCopyBlock } from "@/components/marketing/command-copy-block";
import { cn } from "@/lib/utils";

interface CommandSection {
  id: string;
  command: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  usage: string;
  example: { input: string; output: string };
  options?: { flag: string; description: string }[];
  note?: string;
}

const COMMANDS: CommandSection[] = [
  {
    id: "init",
    command: "zap init",
    title: "Setup wizard",
    description:
      "Interactive first-time setup. Creates a git repo if needed, sets your identity, generates .gitignore from your project stack, and connects to your dashboard.",
    icon: <FolderSimplePlus size={20} weight="fill" />,
    usage: "zap init",
    example: {
      input: "$ zap init",
      output: `  ◆  Setting up your project...
  ✓  Initialized empty Git repo
  ✓  Identity set — Alex
  ✓  .gitignore generated (12 entries)
  ✓  Dashboard linked
  →  Ready in 1.2s`,
    },
    note: "zap init is interactive. It will prompt you for any information it needs. Re-run anytime to reconnect a different dashboard.",
  },
  {
    id: "push",
    command: "zap",
    title: "Push",
    description:
      "The default command. Stages all changes, generates a commit message, and pushes to the current branch. If the project hasn't been initialized yet, runs the setup wizard first.",
    icon: <Lightning size={20} weight="fill" />,
    usage: "zap",
    example: {
      input: "$ zap",
      output: `  ◆  Pushing to feat/login
  ✓  Staged 3 files
  ✓  Committed as a3f91c2
  ✓  Pushed to origin/feat/login
  →  Done in 1.8s`,
    },
    options: [
      { flag: "--ai", description: "Generate commit message with AI" },
      { flag: "--dry-run", description: "Simulate the full flow without making changes" },
      { flag: "--check", description: "Force pre-push checks (lint/test/build)" },
      { flag: "--skip-check", description: "Skip pre-push checks for this push" },
      { flag: "--undo", description: "Undo the last commit (soft reset)" },
    ],
  },
  {
    id: "ai-commit",
    command: "zap --ai",
    title: "AI commit messages",
    description:
      "Analyzes your repo context — file tree, changed files, README — and writes an accurate Conventional Commit with AI. Accept, edit, or regenerate the suggestion.",
    icon: <Sparkle size={20} weight="fill" />,
    usage: "zap --ai",
    example: {
      input: "$ zap --ai",
      output: `  ◌  Scanning repo context...
  ◌  Generating commit message with AI...

  ○  AI suggestion:
  │  feat(auth): add OTP verification step to login flow
  │
  ?  Accept · Edit · Regenerate`,
    },
    note: "AI commit messages require an API key. Set your key in the environment or run zap init to configure.",
  },
  {
    id: "undo",
    command: "zap --undo",
    title: "Undo last commit",
    description:
      "Soft-resets your last commit (git reset --soft HEAD~1) while keeping your changes staged. Safe, instant, no force push needed.",
    icon: <ArrowCounterClockwise size={20} weight="fill" />,
    usage: "zap --undo",
    example: {
      input: "$ zap --undo",
      output: `  ◇  Resetting HEAD~1
  ✓  Commit undone — changes are staged
  →  HEAD is now at a3f91c2
  →  Run zap to recommit`,
    },
  },
  {
    id: "config",
    command: "zap config",
    title: "Configuration",
    description:
      "View or update your local CLI configuration — pre-push check behavior, AI defaults, main branch warnings, and more.",
    icon: <ShieldCheck size={20} weight="fill" />,
    usage: "zap config --show",
    example: {
      input: "$ zap config --show",
      output: `  initialized     yes
  check mode      ask
  ai default      off
  warn on main    on
  default branch  main
  dashboard       connected
  AI key          configured`,
    },
    options: [
      { flag: "--show", description: "Show all current configuration" },
      { flag: "--check <mode>", description: "Set pre-push check behavior: always | never | ask" },
      { flag: "--ai <state>", description: "Set default AI mode: on | off" },
      { flag: "--warn-main <state>", description: "Main branch warning: on | off" },
      { flag: "--reset", description: "Reset all configuration to defaults" },
    ],
  },
  {
    id: "log",
    command: "zap log",
    title: "Push history",
    description:
      "View recent push history across your repos. Shows time, branch, commit message, and hash. If connected to a dashboard, fetches from the cloud; otherwise reads from local cache.",
    icon: <ClockCounterClockwise size={20} weight="fill" />,
    usage: "zap log",
    example: {
      input: "$ zap log -n 5",
      output: `  TIME        BRANCH       MESSAGE                          HASH
  2m ago      feat/login   feat(auth): add OTP verificati…  a3f91c2
  1h ago      main         fix: header alignment on mobile   b8e2d1f
  3h ago      feat/login   chore: update deps               e7c3a9b
  1d ago      main         docs: update README               f1d4e5c
  2d ago      main         feat: add dark mode toggle        9a2b3c4`,
    },
    options: [
      { flag: "-n, --limit <number>", description: "Number of entries to show (default: 20)" },
    ],
  },
  {
    id: "gitignore",
    command: "zap init",
    title: "Smart .gitignore",
    description:
      "Auto-detects your project stack — Node, Next.js, React, Python, Django, Go, Rust, and more — and generates the right .gitignore. Generated automatically during zap init.",
    icon: <FileText size={20} weight="fill" />,
    usage: "zap init  (generated automatically)",
    example: {
      input: "# Generated by zap init",
      output: `  node_modules/
  .next/
  dist/
  build/
  .env.local
  *.log
  .DS_Store
  coverage/
  .cache/`,
    },
    note: "Re-run zap init to regenerate. Custom entries are preserved in a .gitignore.custom file.",
  },
];

const NAV_ITEMS = COMMANDS.map((c, i) => ({ id: c.id, label: `0${i + 1}`.slice(-2), command: c.command, title: c.title }));

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-canvas p-4 font-mono text-[13px] leading-relaxed text-fg whitespace-pre-wrap">
      {children}
    </pre>
  );
}

export default function DocsPage() {
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);

  useEffect(() => {
    const ids = NAV_ITEMS.map((c) => document.getElementById(c.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background Borders */}
      <div className="pointer-events-none fixed inset-0 z-0 flex justify-center px-6">
        <div className="w-full max-w-[1200px] border-l border-r border-dashed border-white/10" />
      </div>

      <div className="relative z-10">
        <MarketingNavbar />
      </div>

      <main className="relative z-10 flex-1">
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-center gap-3">
              <div>
                <h1 className="font-display text-3xl font-bold text-fg sm:text-4xl">Documentation</h1>
                <p className="mt-1 text-fg-muted">
                  Everything you need to use zap, from setup to advanced configuration.
                </p>
              </div>
            </div>

            <div className="lg:hidden mb-8">
              <label htmlFor="mobile-nav" className="sr-only">Jump to section</label>
              <select
                id="mobile-nav"
                value={activeId}
                onChange={(e) => {
                  const id = e.target.value;
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg-muted focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {NAV_ITEMS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} {item.command} — {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-10">
              <nav className="hidden w-56 shrink-0 lg:block">
                <div className="sticky top-28 flex flex-col gap-1">
                  <span className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-fg-subtle">
                    Commands
                  </span>
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={cn(
                        "rounded-md px-3 py-2 text-[13px] transition-colors",
                        activeId === item.id
                          ? "bg-brand/10 text-fg"
                          : "text-fg-muted hover:bg-surface hover:text-fg"
                      )}
                    >
                      <span className={cn("font-mono", activeId === item.id ? "text-brand" : "text-fg-subtle")}>
                        {item.label}
                      </span>
                      <span className="ml-2 text-fg-muted">{item.command}</span>
                      <span className={cn("ml-1", activeId === item.id ? "text-fg" : "text-fg-muted/60")}>
                        {item.title}
                      </span>
                    </a>
                  ))}
                </div>
              </nav>

              <div className="min-w-0 flex-1">
                <div className="mb-10 rounded-xl border border-brand/10 bg-gradient-to-r from-brand/5 to-transparent p-5">
                  <div className="flex items-center gap-2 text-sm">
                    <Terminal size={18} className="text-brand shrink-0" />
                    <span className="text-fg-muted">
                      Get started —{" "}
                    </span>
                    <code className="font-mono text-fg whitespace-nowrap">npm install -g zap-git</code>
                  </div>
                </div>

                <div className="flex flex-col gap-16">
                  {COMMANDS.map((section) => (
                    <article key={section.id} id={section.id} className="scroll-mt-28">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand shrink-0">
                          {section.icon}
                        </div>
                        <h2 className="font-display text-xl font-bold text-fg">{section.title}</h2>
                      </div>

                      <p className="mb-6 text-[14px] text-fg-muted leading-relaxed max-w-3xl">
                        {section.description}
                      </p>

                      <div className="mb-6">
                        <h3 className="mb-2 text-[13px] font-semibold text-fg uppercase tracking-wider">
                          Usage
                        </h3>
                        <CommandCopyBlock command={section.usage} />
                      </div>

                      <div className="mb-6">
                        <h3 className="mb-2 text-[13px] font-semibold text-fg uppercase tracking-wider">
                          Example
                        </h3>
                        <CodeBlock>
                          {section.example.input}
                          {"\n"}
                          {section.example.output}
                        </CodeBlock>
                      </div>

                      {section.options && section.options.length > 0 && (
                        <div className="mb-6">
                          <h3 className="mb-2 text-[13px] font-semibold text-fg uppercase tracking-wider">
                            Options
                          </h3>
                          <div className="overflow-hidden rounded-lg border border-border">
                            {section.options.map((opt, i) => (
                              <div
                                key={opt.flag}
                                className={cn(
                                  "flex items-start gap-4 px-4 py-3",
                                  i < section.options!.length - 1 && "border-b border-border"
                                )}
                              >
                                <code className="shrink-0 rounded bg-surface px-2 py-0.5 font-mono text-[12px] text-brand">
                                  {opt.flag}
                                </code>
                                <span className="text-[13px] text-fg-muted">{opt.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.note && (
                        <div className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-[13px] text-fg-muted">
                          <span className="font-semibold text-warning">Note:</span> {section.note}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <MarketingFooter />
      </div>
    </div>
  );
}
