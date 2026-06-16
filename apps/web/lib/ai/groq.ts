import Groq from "groq-sdk";

export const GROQ_MODEL = "openai/gpt-oss-120b";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_DIFF_CHARS = 6000;

/**
 * System prompt tuned for accurate Conventional Commits messages.
 * Instructs the model to read specific symbols (function names, component
 * names, config keys) from the diff rather than producing generic messages.
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
- feat(auth): add OTP verification step to login flow
- fix(api): handle null response in fetchOrders
- refactor(db): extract connection pool into separate module
- docs(readme): document zap --dry-run flag

Bad examples (too vague — avoid this style):
- chore: update files
- fix: bug fixes
- feat: changes to code`;

export class GroqCommitError extends Error {
  constructor(
    message: string,
    public reason: "no-server-key" | "timeout" | "api-error" | "empty-diff"
  ) {
    super(message);
    this.name = "GroqCommitError";
  }
}

export interface GroqCommitResult {
  message: string;
  tokensUsed: number;
  model: string;
}

/**
 * Generates a Conventional Commits message from a git diff using the
 * platform's Groq API key (server-side only). Users never need their own key.
 */
export async function generateCommitMessageViaGroq(diff: string): Promise<GroqCommitResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqCommitError(
      "AI commit messages are not configured on this server (missing GROQ_API_KEY)",
      "no-server-key"
    );
  }

  const activeDiff = diff.slice(0, MAX_DIFF_CHARS);
  if (!activeDiff.trim()) {
    throw new GroqCommitError("No diff content to summarize", "empty-diff");
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

    // Strip any chain-of-thought prefix the model might prepend, plus
    // surrounding quotes/backticks/code fences.
    const cleaned = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^```[a-z]*\n?/im, "")
      .replace(/```$/im, "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .trim();

    const message = cleaned.split("\n").map((l) => l.trim()).filter(Boolean)[0] ?? "";

    if (!message) {
      throw new GroqCommitError("Empty response from Groq model", "api-error");
    }

    const tokensUsed = completion.usage?.total_tokens ?? 0;
    return { message, tokensUsed, model: GROQ_MODEL };
  } catch (err) {
    if (err instanceof GroqCommitError) throw err;
    const msg = (err as Error).message ?? "";
    if (/timeout|ETIMEDOUT|ECONNABORTED/i.test(msg)) {
      throw new GroqCommitError("Groq API request timed out", "timeout");
    }
    throw new GroqCommitError(`Groq API request failed: ${msg}`, "api-error");
  }
}
