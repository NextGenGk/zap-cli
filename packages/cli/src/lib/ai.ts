import Groq from "groq-sdk";
import type { ChangedFile } from "./git.js";

export const GROQ_MODEL = "openai/gpt-oss-120b";

export const COMMIT_MESSAGE_SYSTEM_PROMPT = `You are an expert software engineer writing a git commit message for the exact diff provided below.

Read the diff carefully:
- File paths tell you the area of the codebase (the "scope").
- Lines starting with "+" were added, lines starting with "-" were removed.
- Function/class/component names, imports, and config keys that changed are the most important signal — name them when relevant.

Write ONE commit message in Conventional Commits format: type(scope): description

Rules:
1. Pick the most accurate type: feat (new capability), fix (bug fix), refactor (no behavior change), docs, style, test, build, ci, perf, or chore.
2. The scope is the most relevant directory, module, or component name from the changed file paths — omit it only if no single scope fits.
3. The description must say what changed in the code, using specific names from the diff (e.g. "add retry logic to fetchUser", not "update files" or "make changes").
4. Maximum 72 characters total. Present tense. No trailing period. No markdown, no quotes, no explanation — output only the commit message line.

Good examples:
- feat(auth): add OTP verification step to login flow
- fix(api): handle null response in fetchOrders
- refactor(db): extract connection pool into separate module

Bad examples (too vague):
- chore: update files
- fix: bug fixes`;

export class AiCommitError extends Error {
  constructor(
    message: string,
    public reason: "no-key" | "timeout" | "api-error" | "empty-diff"
  ) {
    super(message);
    this.name = "AiCommitError";
  }
}

const MAX_DIFF_CHARS = 6000;
const REQUEST_TIMEOUT_MS = 15_000;

export interface AiCommitResult {
  message: string;
  tokensUsed: number;
  model: string;
}

/**
 * Generates a commit message locally using the user's own GROQ_API_KEY.
 * This is the self-hosted fallback path; the primary path is the dashboard
 * proxy (/api/ai/commit-message) which uses the platform's key.
 */
export async function generateCommitMessage(
  diff: string,
  apiKey: string | undefined
): Promise<AiCommitResult> {
  if (!apiKey) {
    throw new AiCommitError("GROQ_API_KEY not set", "no-key");
  }

  const activeDiff = diff.slice(0, MAX_DIFF_CHARS);
  if (!activeDiff.trim()) {
    throw new AiCommitError("No diff content to summarize", "empty-diff");
  }

  const client = new Groq({ apiKey, timeout: REQUEST_TIMEOUT_MS });

  try {
    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: COMMIT_MESSAGE_SYSTEM_PROMPT },
        { role: "user", content: `Diff:\n\n${activeDiff}` },
      ],
      temperature: 0.2,
      max_completion_tokens: 120,
      top_p: 0.9,
      reasoning_effort: "medium",
      stream: false,
      stop: null,
    } as Parameters<typeof client.chat.completions.create>[0]) as import("groq-sdk/resources/chat/completions").ChatCompletion;

    const raw: string = completion.choices?.[0]?.message?.content ?? "";

    const cleaned = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^```[a-z]*\n?/im, "")
      .replace(/```$/im, "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .trim();

    const message =
      cleaned.split("\n").map((l) => l.trim()).filter(Boolean)[0] ?? "";

    if (!message) {
      throw new AiCommitError("Empty response from Groq model", "api-error");
    }

    const tokensUsed = completion.usage?.total_tokens ?? 0;
    return { message, tokensUsed, model: GROQ_MODEL };
  } catch (err) {
    if (err instanceof AiCommitError) throw err;
    const msg = (err as Error).message ?? "";
    if (/timeout|ETIMEDOUT|ECONNABORTED/i.test(msg)) {
      throw new AiCommitError("Groq API request timed out", "timeout");
    }
    throw new AiCommitError(`Groq API request failed: ${msg}`, "api-error");
  }
}

/**
 * Heuristic fallback: builds a reasonable commit message purely from the
 * list of changed files — no AI, no network. Used when AI is unavailable.
 */
export function suggestCommitMessageFromFiles(files: ChangedFile[]): string {
  if (files.length === 0) return "chore: update files";

  const added    = files.filter((f) => f.status === "A");
  const deleted  = files.filter((f) => f.status === "D");
  const modified = files.filter((f) => f.status === "M" || f.status === "R");

  const allPaths = files.map((f) => f.path);
  const scope = guessScope(allPaths);
  const scopeSuffix = scope ? `(${scope})` : "";

  if (files.length === 1) {
    const file = files[0];
    const base = baseName(file.path);
    if (file.status === "A") return `feat${scopeSuffix}: add ${base}`;
    if (file.status === "D") return `chore${scopeSuffix}: remove ${base}`;
    return `fix${scopeSuffix}: update ${base}`;
  }

  if (added.length > 0 && modified.length === 0 && deleted.length === 0) {
    return `feat${scopeSuffix}: add ${added.length} new files`;
  }
  if (deleted.length > 0 && added.length === 0 && modified.length === 0) {
    return `chore${scopeSuffix}: remove ${deleted.length} files`;
  }

  return `chore${scopeSuffix}: update ${files.length} files`;
}

function baseName(path: string): string {
  return path.split("/").pop() ?? path;
}

const GENERIC_DIRS = new Set(["src", "app", "lib", "test", "tests"]);

function immediateDir(path: string): string | null {
  const parts = path.split("/");
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

function topDir(path: string): string | null {
  const parts = path.split("/");
  return parts.length >= 2 ? parts[0] : null;
}

function sharedNonGenericDir(
  paths: string[],
  dirOf: (p: string) => string | null
): string | null {
  const dirs = paths.map(dirOf);
  if (dirs.some((d) => d === null)) return null;
  const first = dirs[0]!;
  if (!dirs.every((d) => d === first)) return null;
  if (GENERIC_DIRS.has(first)) return null;
  return first;
}

function guessScope(paths: string[]): string | null {
  return (
    sharedNonGenericDir(paths, immediateDir) ??
    sharedNonGenericDir(paths, topDir)
  );
}
