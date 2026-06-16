import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { authenticateApiKey, unauthorized } from "@/lib/api/auth";
import { generateCommitMessageViaGroq, GroqCommitError } from "@/lib/ai/groq";

/**
 * POST /api/ai/commit-message — called by `zap --ai`.
 *
 * SaaS AI path: the CLI sends the diff + its zap API key. This route
 * generates the commit message using the platform's own Groq API key
 * (GROQ_API_KEY env var). Users never need their own AI key.
 *
 * Body:     { diff: string }
 * Response: { message, tokens_used, model }
 */
export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const diff = typeof body.diff === "string" ? body.diff : "";

  try {
    const result = await generateCommitMessageViaGroq(diff);

    // Track token usage for the dashboard AI-usage page (non-blocking).
    const admin = createAdminClient();
    void admin.from("ai_usage").insert({
      user_id: auth.userId,
      tokens_used: result.tokensUsed,
      model: result.model,
    });

    return NextResponse.json({
      message: result.message,
      tokens_used: result.tokensUsed,
      model: result.model,
    });
  } catch (err) {
    if (err instanceof GroqCommitError) {
      const status =
        err.reason === "no-server-key" ? 503
        : err.reason === "empty-diff"   ? 400
        : 502;
      return NextResponse.json({ error: err.message, reason: err.reason }, { status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
