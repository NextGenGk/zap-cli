import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function MiniTerminal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-canvas font-mono text-[11px] leading-relaxed p-3 space-y-1.5 h-full flex-1 flex flex-col", className)}>
      {children}
    </div>
  );
}

function MiniLine({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-1.5", className)}>{children}</div>;
}

export const AI_COMMIT_VISUAL = (
  <MiniTerminal>
    <MiniLine>
      <span className="text-fg-subtle">$</span>
      <span>zap --ai</span>
    </MiniLine>
    <MiniLine>
      <span className="text-fg-subtle">◌</span>
      <span className="text-fg-subtle">Scanning repo context...</span>
    </MiniLine>
    <MiniLine>
      <span className="text-fg-subtle">◌</span>
      <span className="text-fg-subtle">3 files changed on feat/login</span>
    </MiniLine>
    <div className="pl-4 space-y-1 my-2">
      <MiniLine>
        <span className="text-warning">M</span>
        <span className="text-warning">src/auth/Login.jsx</span>
      </MiniLine>
      <MiniLine>
        <span className="text-success">A</span>
        <span className="text-success">src/auth/OTP.jsx</span>
      </MiniLine>
      <MiniLine>
        <span className="text-danger">D</span>
        <span className="text-danger">src/auth/old.jsx</span>
      </MiniLine>
    </div>
    <div className="border-t border-border pt-2 mt-auto">
      <div className="text-[10px] uppercase tracking-wider text-brand mb-1">
        AI suggestion
      </div>
      <div className="text-fg border-l-2 border-brand pl-2">
        feat(auth): add OTP verification to login flow
      </div>
    </div>
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success">Done in 2.4s</span>
    </MiniLine>
  </MiniTerminal>
);

export const GIT_INIT_VISUAL = (
  <MiniTerminal>
    <MiniLine>
      <span className="text-fg-subtle">$</span>
      <span>zap init</span>
    </MiniLine>
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success">Git repo initialized</span>
    </MiniLine>
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success">Identity configured</span>
    </MiniLine>
    <MiniLine className="text-[9px] text-fg-muted ml-5 opacity-70">{'\u2192'} git config user.name &ldquo;Alex&rdquo;</MiniLine>
    
    <MiniLine>
      <span className="text-fg-subtle">◇</span>
      <span className="text-fg-subtle">.gitignore generated</span>
    </MiniLine>
    <MiniLine className="text-[9px] text-fg-muted ml-5 opacity-70">→ Detected Next.js project</MiniLine>
    
    <MiniLine>
      <span className="text-fg-subtle">◇</span>
      <span className="text-fg-subtle">Dashboard connected</span>
    </MiniLine>
    <MiniLine className="text-[9px] text-fg-muted ml-5 opacity-70">→ Link established</MiniLine>
    <div className="border-t border-border pt-2 mt-auto text-[10px] text-fg-muted text-center">
      Ready to zap →
    </div>
  </MiniTerminal>
);

export const UNDO_VISUAL = (
  <MiniTerminal>
    <div className="flex items-center gap-2 py-1 opacity-50">
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-2 h-2 rounded-full border border-border-strong" />
        <div className="w-px h-6 bg-border" />
      </div>
      <span className="text-fg-muted text-[10px] leading-none mb-3">
        HEAD~1 fix: header alignment
      </span>
    </div>
    <div className="flex items-center gap-2 py-1">
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-2 h-2 rounded-full bg-brand" />
        <div className="w-px h-6 bg-border" />
        <div className="w-2 h-2 rounded-full border border-border-strong" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-fg-muted line-through text-[10px] leading-none">
          HEAD  feat: add login
        </span>
        <span className="text-fg text-[10px] leading-none">
          HEAD  unstaged changes
        </span>
      </div>
    </div>
    <div className="border-t border-border pt-2 mt-auto text-warning text-[10px]">
      ← zap --undo
    </div>
  </MiniTerminal>
);

export const CHECKS_VISUAL = (
  <MiniTerminal>
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>lint</span>
        <span className="ml-auto text-[10px] text-success">pass</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>test</span>
        <span className="ml-auto text-[10px] text-success">pass</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>build</span>
        <span className="ml-auto text-[10px] text-success">pass</span>
      </div>
    </div>
    <div className="border-t border-border pt-2 mt-auto text-success text-[10px] text-center">
      ✓ All checks passed
    </div>
  </MiniTerminal>
);

export const GITIGNORE_VISUAL = (
  <MiniTerminal>
    <div className="text-fg-subtle">my-project/</div>
    <div className="ml-3 text-fg">├── src/</div>
    <div className="ml-6 text-fg">│   └── app.tsx</div>
    <div className="ml-3 text-fg-muted line-through">├── node_modules/</div>
    <div className="ml-3 text-fg-muted line-through">├── .next/</div>
    <div className="ml-3 text-fg-muted line-through">├── .env.local</div>
    <div className="ml-3 text-success">└── README.md</div>
    <div className="border-t border-border pt-1.5 mt-auto text-[10px] text-fg-subtle text-center">
      .gitignore · 12 entries auto-detected
    </div>
  </MiniTerminal>
);

export const DASHBOARD_VISUAL = (
  <div className="rounded-lg border border-border bg-canvas p-3 h-full flex-1 flex flex-col">
    <div className="flex items-end gap-1.5 flex-1 min-h-[4rem]">
      {[35, 60, 25, 75, 50, 85, 65].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm opacity-80 transition-all duration-500"
          style={{
            height: `${h}%`,
            backgroundColor: `oklch(68.56% ${0.12 + i * 0.006} 158.13)`,
          }}
        />
      ))}
    </div>
    <div className="mt-2 flex justify-between text-[9px] text-fg-subtle">
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
      <span>Sun</span>
    </div>
    <div className="mt-2 flex justify-between border-t border-border pt-2 text-[10px]">
      <span className="text-brand">4.2k pushes</span>
      <span className="text-fg-muted">92% AI</span>
    </div>
  </div>
);

export const INSTALL_VISUAL = (
  <MiniTerminal>
    <MiniLine>
      <span className="text-fg-subtle">$</span>
      <span>npm install -g zap-git</span>
    </MiniLine>
    <MiniLine>
      <span className="text-fg-subtle">◌</span>
      <span className="text-fg-subtle">Fetching from registry...</span>
    </MiniLine>
    <MiniLine className="text-fg-subtle ml-5">
      zap-git@latest
    </MiniLine>
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success">Added to PATH</span>
    </MiniLine>
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success">zap is ready</span>
    </MiniLine>
    <div className="border-t border-border pt-2 mt-auto">
      <MiniLine className="text-fg">
        <span className="text-brand">⚡</span>
        <span className="text-[10px]">zap --help for available commands</span>
      </MiniLine>
    </div>
  </MiniTerminal>
);

export const INIT_VISUAL = (
  <MiniTerminal>
    <MiniLine>
      <span className="text-fg-subtle">$</span>
      <span>zap init</span>
    </MiniLine>
    <MiniLine>
      <span className="text-fg-subtle">◆</span>
      <span className="text-fg-subtle">Setting up your project...</span>
    </MiniLine>
    <div className="border-t border-border/50 my-1" />
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success text-[10px]">Initialized empty Git repo</span>
    </MiniLine>
    <MiniLine className="text-[9px] text-fg-muted ml-5 opacity-70">
      → git init
    </MiniLine>
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success text-[10px]">Identity set</span>
    </MiniLine>
    <MiniLine className="text-[9px] text-fg-muted ml-5 opacity-70">
      → git config user.name &quot;You&quot;
    </MiniLine>
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success text-[10px]">.gitignore generated</span>
    </MiniLine>
    <MiniLine>
      <span className="text-success">✓</span>
      <span className="text-success text-[10px]">Dashboard linked</span>
    </MiniLine>
    <div className="border-t border-border pt-2 mt-auto text-[10px] text-fg-muted text-center">
      Ready in 1.2s →
    </div>
  </MiniTerminal>
);

export const PUSH_VISUAL = (
  <MiniTerminal>
    <MiniLine>
      <span className="text-fg-subtle">$</span>
      <span>zap --ai</span>
    </MiniLine>
    <MiniLine className="text-fg-subtle">
      <span>◆</span>
      <span>Analyzing repo context...</span>
    </MiniLine>
    <div className="border-t border-border/50 my-1" />
    <div className="text-[10px] uppercase tracking-wider text-brand mb-1">
      AI commit message
    </div>
    <div className="text-fg border-l-2 border-brand pl-2 text-[10px] leading-relaxed mb-2">
      feat(auth): add OTP verification<br />
      step to login flow
    </div>
    <MiniLine className="text-fg text-[10px]">
      <span className="text-fg-muted">Accept</span>
      <span className="text-fg-subtle">|</span>
      <span className="text-brand">Edit</span>
      <span className="text-fg-subtle">|</span>
      <span className="text-fg-muted">Regenerate</span>
    </MiniLine>
    <div className="border-t border-border pt-2 mt-auto">
      <MiniLine>
        <span className="text-success">✓</span>
        <span className="text-success">Pushed to origin/main</span>
      </MiniLine>
    </div>
  </MiniTerminal>
);
