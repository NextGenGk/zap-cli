import axios from "axios";

export const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
export const NVIDIA_MODEL = "google/gemma-4-31b-it";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_DIFF_CHARS = 6000;

/**
 * System prompt for generating commit messages. Optimized for accuracy:
 * the model is told exactly what signals to look at (file paths, added vs.
 * removed lines, hunk headers) and is given concrete good/bad examples so
 * it produces a message that describes *what changed*, not a generic
 * restatement of the file list.
 */
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
- feat(auth): add OTP verification step to login
- fix(api): handle null response in fetchOrders
- refactor(db): extract connection pool into separate module
- docs(readme): document zap --dry-run flag

Bad examples (too vague — avoid this style):
- chore: update files
- fix: bug fixes
- feat: changes to code`;

export class AiCommitError extends Error {
  constructor(message: string, public reason: "no-server-key" | "timeout" | "api-error" | "empty-diff") {
    super(message);
    this.name = "AiCommitError";
  }
}

export interface AiCommitResult {
  message: string;
  tokensUsed: number;
  model: string;
}

/**
 * Generates a Conventional Commits message from a git diff using the
 * platform's NVIDIA NIM key (server-side only — the CLI/user never sees or
 * needs this key).
 */
export async function generateCommitMessageServerSide(diff: string): Promise<AiCommitResult> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new AiCommitError("AI commit messages are not configured on this server", "no-server-key");
  }

  const activeDiff = diff.slice(0, MAX_DIFF_CHARS);
  if (!activeDiff.trim()) {
    throw new AiCommitError("No diff content to summarize", "empty-diff");
  }

  try {
    const response = await axios.post(
      NVIDIA_API_URL,
      {
        model: NVIDIA_MODEL,
        messages: [
          { role: "system", content: COMMIT_MESSAGE_SYSTEM_PROMPT },
          { role: "user", content: `Diff:\n\n${activeDiff}` },
        ],
        max_tokens: 120,
        temperature: 0.2,
        top_p: 0.9,
        stream: false,
        chat_template_kwargs: { enable_thinking: true },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const raw: string = response.data?.choices?.[0]?.message?.content ?? "";

    // Strip any <think>...</think> block Gemma may prepend in thinking mode,
    // plus surrounding quotes/backticks/code fences the model sometimes adds.
    const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const message = cleaned
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/```$/i, "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)[0];

    if (!message) {
      throw new AiCommitError("Empty response from model", "api-error");
    }

    const tokensUsed: number = response.data?.usage?.total_tokens ?? 0;
    return { message, tokensUsed, model: NVIDIA_MODEL };
  } catch (err) {
    if (err instanceof AiCommitError) throw err;
    if (axios.isAxiosError(err) && (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT")) {
      throw new AiCommitError("NVIDIA NIM request timed out", "timeout");
    }
    throw new AiCommitError(`NVIDIA NIM request failed: ${(err as Error).message}`, "api-error");
  }
}
