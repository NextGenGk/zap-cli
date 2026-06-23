import axios from "axios";
import type { PushLogEntry } from "./config.js";

const SYNC_TIMEOUT_MS = 5000;
const AI_TIMEOUT_MS = 30000;

export interface SyncCredentials {
  apiKey: string;
  baseUrl: string;
}

/**
 * Returns credentials for syncing with the zap dashboard, or null if the
 * CLI hasn't been connected to a dashboard account. `baseUrl` points at
 * the Next.js app (its API routes proxy to Supabase with the service role
 * key + RLS-aware lookups, so the CLI never talks to Supabase directly).
 */
export function getSyncCredentials(cfg: { zapApiKey: string; zapSupabaseUrl: string }): SyncCredentials | null {
  if (!cfg.zapApiKey || !cfg.zapSupabaseUrl) return null;
  return { apiKey: cfg.zapApiKey, baseUrl: cfg.zapSupabaseUrl.replace(/\/+$/, "") };
}

export interface PushEventPayload {
  repoUrl: string | null;
  branch: string;
  commitHash: string;
  commitMsg: string;
  filesChanged: number;
  usedAi: boolean;
  durationMs: number;
}

/**
 * Logs a push event to the dashboard. Never throws -- failures (no
 * credentials, offline, server error, timeout) are swallowed so the CLI
 * always works without a network connection. Returns true on success.
 */
export async function logPushEvent(
  creds: SyncCredentials | null,
  payload: PushEventPayload
): Promise<boolean> {
  if (!creds) return false;

  try {
    await axios.post(
      `${creds.baseUrl}/api/push-events`,
      {
        repo_url: payload.repoUrl,
        branch: payload.branch,
        commit_hash: payload.commitHash,
        commit_msg: payload.commitMsg,
        files_changed: payload.filesChanged,
        used_ai: payload.usedAi,
        duration_ms: payload.durationMs,
      },
      {
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: SYNC_TIMEOUT_MS,
      }
    );
    return true;
  } catch {
    return false;
  }
}

/** Marks the most recent push as undone on the dashboard. Non-blocking. */
export async function logUndoEvent(creds: SyncCredentials | null, commitHash: string): Promise<boolean> {
  if (!creds) return false;
  try {
    await axios.patch(
      `${creds.baseUrl}/api/push-events`,
      { commit_hash: commitHash, undone: true },
      {
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: SYNC_TIMEOUT_MS,
      }
    );
    return true;
  } catch {
    return false;
  }
}

/** Records an AI usage event (token count) on the dashboard. Non-blocking. */
export async function logAiUsage(creds: SyncCredentials | null, tokensUsed: number, model: string): Promise<boolean> {
  if (!creds || tokensUsed <= 0) return false;
  try {
    await axios.post(
      `${creds.baseUrl}/api/ai-usage`,
      { tokens_used: tokensUsed, model },
      {
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: SYNC_TIMEOUT_MS,
      }
    );
    return true;
  } catch {
    return false;
  }
}

/** Fetches recent push events from the dashboard for `zap log`. Returns [] on any failure. */
export async function fetchRemotePushLog(creds: SyncCredentials | null, limit = 20): Promise<PushLogEntry[]> {
  if (!creds) return [];
  try {
    const res = await axios.get(`${creds.baseUrl}/api/push-events`, {
      params: { limit },
      headers: { Authorization: `Bearer ${creds.apiKey}` },
      timeout: SYNC_TIMEOUT_MS,
    });

    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    return rows.map((row: any) => ({
      id: row.id,
      repo: row.repo_url ?? "",
      branch: row.branch ?? "",
      commitMsg: row.commit_msg ?? "",
      commitHash: row.commit_hash ?? "",
      filesChanged: row.files_changed ?? 0,
      usedAi: !!row.used_ai,
      undone: !!row.undone,
      durationMs: row.duration_ms ?? 0,
      createdAt: row.created_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export interface VerifyResult {
  ok: boolean;
  error?: string;
}

/** Verifies an API key against the dashboard during `zap init`. */
export async function verifyApiKey(apiKey: string, baseUrl: string): Promise<VerifyResult> {
  try {
    const res = await axios.get(`${baseUrl.replace(/\/+$/, "")}/api/keys/verify`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: SYNC_TIMEOUT_MS,
    });
    return { ok: res.status === 200 };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.code === "ENOTFOUND") return { ok: false, error: "Dashboard URL is unreachable (DNS lookup failed)" };
      if (err.code === "ECONNREFUSED") return { ok: false, error: "Dashboard refused the connection" };
      if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") return { ok: false, error: "Connection timed out" };
      if (err.response?.status === 401) return { ok: false, error: "API key is invalid or revoked" };
      if (err.response) return { ok: false, error: `Dashboard returned ${err.response.status}` };
    }
    return { ok: false, error: (err as Error).message };
  }
}

export interface DashboardAiResult {
  message: string;
  tokensUsed: number;
  model: string;
}

export type DashboardAiFailureReason = "no-dashboard" | "no-server-key" | "empty-diff" | "timeout" | "api-error";

export class DashboardAiError extends Error {
  constructor(message: string, public reason: DashboardAiFailureReason) {
    super(message);
    this.name = "DashboardAiError";
  }
}

/**
 * Generates a commit message via the zap dashboard's `/api/ai/commit-message`
 * endpoint. This is the primary `zap --ai` path for connected accounts: the
 * platform's Groq API key lives server-side, so the user never needs their
 * own AI provider key.
 */
export async function generateAiCommitMessage(creds: SyncCredentials | null, diff: string): Promise<DashboardAiResult> {
  if (!creds) {
    throw new DashboardAiError("Not connected to a zap dashboard", "no-dashboard");
  }

  try {
    const res = await axios.post(
      `${creds.baseUrl}/api/ai/commit-message`,
      { diff },
      {
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: AI_TIMEOUT_MS,
      }
    );

    const message = typeof res.data?.message === "string" ? res.data.message.trim() : "";
    if (!message) {
      throw new DashboardAiError("Empty response from dashboard", "api-error");
    }

    return {
      message,
      tokensUsed: typeof res.data?.tokens_used === "number" ? res.data.tokens_used : 0,
      model: typeof res.data?.model === "string" ? res.data.model : "openai/gpt-oss-120b",
    };
  } catch (err) {
    if (err instanceof DashboardAiError) throw err;
    if (axios.isAxiosError(err)) {
      if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
        throw new DashboardAiError("Dashboard AI request timed out", "timeout");
      }
      const reason = err.response?.data?.reason;
      if (err.response?.status === 503 || reason === "no-server-key") {
        throw new DashboardAiError("AI commit messages aren't enabled on this dashboard", "no-server-key");
      }
      if (err.response?.status === 400 && reason === "empty-diff") {
        throw new DashboardAiError("No diff content to summarize", "empty-diff");
      }
      if (err.response) {
        throw new DashboardAiError(`Dashboard returned ${err.response.status}`, "api-error");
      }
      if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
        throw new DashboardAiError(`Cannot reach dashboard (${err.code})`, "api-error");
      }
    }
    throw new DashboardAiError(`Dashboard AI request failed: ${(err as Error).message}`, "api-error");
  }
}
