import chalk from "chalk";
import type { ChangedFile } from "./../lib/git.js";

// Brand palette (subset of the dashboard design tokens)
export const colors = {
  brand: chalk.hex("#6EE7B7"), // zap green
  success: chalk.hex("#4ADE80"),
  warning: chalk.hex("#FACC15"),
  danger: chalk.hex("#F87171"),
  info: chalk.hex("#60A5FA"),
  muted: chalk.hex("#71717A"),
  secondary: chalk.hex("#A1A1AA"),
  primary: chalk.hex("#FAFAFA"),
};

const FILE_STATUS_COLOR: Record<string, (s: string) => string> = {
  M: (s) => colors.warning(s),
  A: (s) => colors.success(s),
  D: (s) => colors.danger(s),
  R: (s) => colors.info(s),
  U: (s) => colors.danger(s),
};

/** "  ◆  zap  —  3 files changed on feat/login" */
export function header(command: string, summary: string): string {
  return `\n  ${colors.brand("◆")}  ${chalk.bold(command)}  ${colors.muted("—")}  ${colors.secondary(summary)}\n`;
}

/** Renders the list of changed files with M/A/D/R color coding. */
export function fileList(files: ChangedFile[], prefix = "[DRY RUN] "): string {
  return files
    .map((f) => {
      const color = FILE_STATUS_COLOR[f.status] ?? colors.secondary;
      return `  ${color(f.status)}  ${chalk.white(f.path)}`;
    })
    .join("\n");
}

export function dryRunFileList(files: ChangedFile[]): string {
  return files
    .map((f) => {
      const color = FILE_STATUS_COLOR[f.status] ?? colors.secondary;
      return `${colors.muted("[DRY RUN]")} ${color(f.status)}  ${chalk.white(f.path)}`;
    })
    .join("\n");
}

export function line(prefix: string, text: string): string {
  return `  ${prefix}  ${text}`;
}

export function step(text: string): string {
  return `\n  ${colors.brand("◇")}  ${text}`;
}

export function info(text: string): string {
  return `  ${colors.info("ℹ")}  ${text}`;
}

export function success(title: string, details: string[] = []): string {
  const head = `\n  ${colors.success("✓")}  ${chalk.bold(title)}`;
  if (details.length === 0) return head + "\n";
  const body = details.map((d) => `     ${colors.muted("→")} ${colors.secondary(d)}`).join("\n");
  return `${head}\n${body}\n`;
}

export function errorBlock(title: string, hint?: string): string {
  const head = `\n  ${colors.danger("✗")}  ${chalk.bold(title)}`;
  if (!hint) return head + "\n";
  return `${head}\n     ${colors.secondary(hint)}\n`;
}

export function warningBlock(title: string, hint?: string): string {
  const head = `\n  ${colors.warning("!")}  ${chalk.bold(title)}`;
  if (!hint) return head + "\n";
  return `${head}\n     ${colors.secondary(hint)}\n`;
}

export function aiBadge(): string {
  return colors.brand("[AI ✦]");
}

export function dryRunPrefixLines(text: string): string {
  return text
    .split("\n")
    .map((l) => (l.trim() ? `${colors.muted("[DRY RUN]")} ${l}` : l))
    .join("\n");
}

export function muted(text: string): string {
  return colors.muted(text);
}

export function brand(text: string): string {
  return colors.brand(text);
}

export function commitMsgBlock(message: string, badge?: string): string {
  const tag = badge ? ` ${badge}` : "";
  return `  ${colors.brand("○")}  Commit message${tag}\n  ${colors.muted("│")}  ${chalk.bold(message)}`;
}

/** Formats a date as a short relative time string: "2h ago", "1d ago", "just now". */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  return `${Math.floor(month / 12)}y ago`;
}

/** Pads a string to `width` characters (right-pads), truncating with `…` if too long. */
export function pad(text: string, width: number): string {
  if (text.length > width) return text.slice(0, width - 1) + "…";
  return text.padEnd(width, " ");
}

