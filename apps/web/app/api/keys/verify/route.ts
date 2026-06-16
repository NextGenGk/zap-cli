import { NextResponse } from "next/server";
import { authenticateApiKey, unauthorized } from "@/lib/api/auth";

/**
 * GET /api/keys/verify — called by `zap init` after the user pastes an API
 * key, to confirm it's valid before saving it locally.
 */
export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return unauthorized();

  return NextResponse.json({ valid: true });
}
