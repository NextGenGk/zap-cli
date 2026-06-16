import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { authenticateApiKey, unauthorized } from "@/lib/api/auth";

/**
 * POST /api/push-events — called by `zap` after a successful push.
 * Body: { repo_url, branch, commit_hash, commit_msg, files_changed, used_ai, duration_ms }
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

  const branch = typeof body.branch === "string" ? body.branch : null;
  const commitHash = typeof body.commit_hash === "string" ? body.commit_hash : null;
  const commitMsg = typeof body.commit_msg === "string" ? body.commit_msg : null;

  if (!branch || !commitHash || !commitMsg) {
    return NextResponse.json({ error: "branch, commit_hash, and commit_msg are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("push_events")
    .insert({
      user_id: auth.userId,
      repo_url: typeof body.repo_url === "string" ? body.repo_url : null,
      branch,
      commit_hash: commitHash,
      commit_msg: commitMsg,
      files_changed: typeof body.files_changed === "number" ? body.files_changed : 0,
      used_ai: !!body.used_ai,
      duration_ms: typeof body.duration_ms === "number" ? body.duration_ms : null,
      undone: false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

/**
 * GET /api/push-events?limit=20 — called by `zap log`.
 */
export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  const url = new URL(request.url);
  const limit = Math.min(Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 100);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("push_events")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * PATCH /api/push-events — called by `zap --undo` to mark the matching push
 * (by commit_hash, for the authenticated user) as undone.
 * Body: { commit_hash, undone: true }
 */
export async function PATCH(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const commitHash = typeof body.commit_hash === "string" ? body.commit_hash : null;
  if (!commitHash) {
    return NextResponse.json({ error: "commit_hash is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("push_events")
    .update({ undone: true })
    .eq("user_id", auth.userId)
    .eq("commit_hash", commitHash);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
