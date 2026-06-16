import * as p from "@clack/prompts";
import { colors } from "./output.js";

/** Throws to unwind the command if the user cancels (Ctrl+C / Esc). */
export function bail(message = "Cancelled."): never {
  p.cancel(message);
  process.exit(0);
}

export function checkCancel<T>(value: T | symbol): T {
  if (p.isCancel(value)) bail();
  return value as T;
}

export async function confirm(message: string, initialValue = true): Promise<boolean> {
  const result = await p.confirm({ message, initialValue });
  return checkCancel(result);
}

export async function text(message: string, defaultValue?: string, placeholder?: string): Promise<string> {
  const result = await p.text({ message, defaultValue, placeholder, initialValue: defaultValue });
  return checkCancel(result);
}

export async function select<T extends string>(
  message: string,
  options: { value: T; label: string; hint?: string }[]
): Promise<T> {
  const result = await p.select({ message, options });
  return checkCancel(result) as T;
}

/** Warns the user before pushing directly to a protected branch (main/master). */
export async function confirmMainBranchPush(branch: string): Promise<boolean> {
  p.log.warn(`You're about to push directly to ${colors.warning(branch)}.`);
  return confirm(`Continue pushing to ${branch}?`, false);
}

const BRANCH_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/**
 * Offers to create and switch to a new branch instead of pushing to a
 * protected branch. Returns the new branch name, or null if the user wants
 * to cancel entirely.
 */
export async function promptCreateBranchInstead(protectedBranch: string): Promise<string | null> {
  const wantsNewBranch = await confirm(`Create a new branch instead of pushing to ${protectedBranch}?`, true);
  if (!wantsNewBranch) return null;

  while (true) {
    const name = await text("New branch name", undefined, "feat/my-change");
    const trimmed = name.trim();
    if (!trimmed) {
      p.log.error("Branch name can't be empty.");
      continue;
    }
    if (!BRANCH_NAME_RE.test(trimmed) || trimmed.includes("..") || trimmed.endsWith("/")) {
      p.log.error("Use letters, numbers, '-', '_', '.', and '/' only (e.g. feat/my-change).");
      continue;
    }
    return trimmed;
  }
}

export type CommitMessageChoice =
  | { action: "accept"; message: string }
  | { action: "regenerate" }
  | { action: "edit"; message: string };

/**
 * Shows a suggested commit message and lets the user accept, edit, or
 * (when AI is enabled) regenerate it.
 */
export async function commitMessagePrompt(
  suggested: string,
  opts: { allowRegenerate?: boolean; label?: string } = {}
): Promise<CommitMessageChoice> {
  const label = opts.label ?? "Commit message";
  p.log.message(`${colors.brand("○")}  ${label}\n${colors.muted("│")}  ${suggested}`);

  if (!opts.allowRegenerate) {
    const useDefault = await confirm("Use this commit message?", true);
    if (useDefault) return { action: "accept", message: suggested };
    const edited = await text("Edit commit message", suggested);
    return { action: "edit", message: edited };
  }

  const choice = await select("Accept / Edit / Regenerate?", [
    { value: "accept", label: "Accept", hint: "use as-is" },
    { value: "edit", label: "Edit", hint: "tweak before committing" },
    { value: "regenerate", label: "Regenerate", hint: "ask AI again" },
  ]);

  if (choice === "accept") return { action: "accept", message: suggested };
  if (choice === "regenerate") return { action: "regenerate" };

  const edited = await text("Edit commit message", suggested);
  return { action: "edit", message: edited };
}

export async function confirmUndo(commitHash: string, commitMsg: string): Promise<boolean> {
  p.log.message(`Last commit: ${colors.muted(commitHash)} ${commitMsg}`);
  return confirm("Undo this commit? (changes are kept, staged)", false);
}

export const intro = p.intro;
export const outro = p.outro;
export const spinner = p.spinner;
export const log = p.log;
export const note = p.note;
