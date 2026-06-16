import { getEffectiveConfig, getPushLog, type PushLogEntry } from "../lib/config.js";
import { getSyncCredentials, fetchRemotePushLog } from "../lib/supabase.js";
import * as out from "../ui/output.js";

export interface LogOptions {
  limit?: number;
}

export async function logCommand(options: LogOptions = {}): Promise<void> {
  const limit = options.limit ?? 20;
  const config = getEffectiveConfig();
  const creds = getSyncCredentials(config);

  const remote = creds ? await fetchRemotePushLog(creds, limit) : [];
  const entries = remote.length > 0 ? remote : getPushLog(limit);

  const source = creds ? (remote.length > 0 ? "dashboard" : "local (dashboard empty)") : "local only";
  console.log(out.header("zap log", `last ${entries.length} push${entries.length === 1 ? "" : "es"} · ${source}`));

  if (entries.length === 0) {
    console.log(out.muted("  No pushes yet. Run `zap` to make your first push.\n"));
    if (!creds) {
      console.log(out.muted("  Tip: connect to the zap dashboard with `zap init` to sync history across machines.\n"));
    }
    return;
  }

  console.log(
    out.muted(`  ${"TIME".padEnd(9)} ${"BRANCH".padEnd(16)} ${"COMMIT MESSAGE".padEnd(40)} HASH`)
  );
  console.log(out.muted(`  ${"-".repeat(75)}`));

  for (const entry of entries) {
    console.log(formatRow(entry));
  }
  console.log("");

  if (!creds) {
    console.log(out.muted("  Connect to the zap dashboard (`zap init`) to sync history across machines.\n"));
  }
}

function formatRow(entry: PushLogEntry): string {
  const time = out.pad(out.timeAgo(entry.createdAt), 9);
  const branch = out.pad(entry.branch, 16);
  const msg = out.pad(entry.commitMsg, 40);
  const hash = entry.commitHash;
  const aiTag = entry.usedAi ? ` ${out.brand("✦")}` : "";
  const undoneTag = entry.undone ? out.muted(" (undone)") : "";
  return `  ${out.muted(time)}${branch}${msg}${out.muted(hash)}${aiTag}${undoneTag}`;
}
