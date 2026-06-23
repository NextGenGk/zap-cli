import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { authenticateApiKey, unauthorized } from "@/lib/api/auth";

/**
 * POST /api/ai-usage — called by `zap --ai` after a successful AI commit
 * message generation.
 * Body: { tokens_used: number, model?: string }
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

  const tokensUsed = typeof body.tokens_used === "number" ? body.tokens_used : 0;
  if (tokensUsed <= 0) {
    return NextResponse.json({ error: "tokens_used must be a positive number" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("ai_usage").insert({
    user_id: auth.userId,
    tokens_used: tokensUsed,
    model: typeof body.model === "string" ? body.model : "default",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
