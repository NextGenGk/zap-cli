import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execa } from "execa";

const CHECK_SCRIPTS = ["lint", "test", "build"] as const;
const MAX_SNIPPET_LINES = 12;

export interface CheckResult {
  script: string;
  passed: boolean;
  output: string;
  durationMs: number;
  exitCode: number | null;
}

/** Returns the configured npm scripts (lint/test/build, in that order) that exist in package.json. */
export function detectCheckScripts(cwd: string = process.cwd()): string[] {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) return [];

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const scripts: Record<string, string> = pkg.scripts ?? {};
    return CHECK_SCRIPTS.filter((name) => typeof scripts[name] === "string");
  } catch {
    return [];
  }
}

/** Trims command output to the last few lines so terminal output stays readable. */
function snippet(text: string): string {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines.slice(-MAX_SNIPPET_LINES).join("\n");
}

/**
 * Runs `npm run <script>` for each detected script, in order, stopping at
 * the first failure. Used by `zap --check` and `checkMode: "always"`.
 */
export async function runPrePushChecks(cwd: string = process.cwd()): Promise<CheckResult[]> {
  const scripts = detectCheckScripts(cwd);
  const results: CheckResult[] = [];

  for (const script of scripts) {
    const start = Date.now();
    try {
      const result = await execa("npm", ["run", script], {
        cwd,
        reject: false,
        timeout: 5 * 60 * 1000,
      });
      const durationMs = Date.now() - start;
      const passed = result.exitCode === 0;
      results.push({
        script,
        passed,
        output: snippet(`${result.stdout}\n${result.stderr}`),
        durationMs,
        exitCode: result.exitCode ?? null,
      });
      if (!passed) break;
    } catch (err) {
      results.push({
        script,
        passed: false,
        output: snippet((err as Error).message),
        durationMs: Date.now() - start,
        exitCode: null,
      });
      break;
    }
  }

  return results;
}
