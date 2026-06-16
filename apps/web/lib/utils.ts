import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a number with thousands separators (e.g. 12450 -> "12,450"). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Formats a timestamp as a short relative time string: "2h ago", "3d ago". */
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

/** Converts a git remote URL (SSH or HTTPS) into a browsable https:// repo URL. */
export function remoteUrlToHttps(remoteUrl: string): string {
  const url = remoteUrl.trim().replace(/\.git$/, "");
  const sshMatch = url.match(/^git@([^:]+):(.+)$/);
  if (sshMatch) return `https://${sshMatch[1]}/${sshMatch[2]}`;
  return url.replace(/^ssh:\/\/git@/, "https://");
}

/** Truncates a string to `max` characters, adding an ellipsis if needed. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
