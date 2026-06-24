import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execa } from "execa";

const CHECK_SCRIPT_PATTERNS = [/lint/i, /test/i, /build/i];
const MAX_SNIPPET_LINES = 12;

export interface CheckResult {
  script: string;
  passed: boolean;
  output: string;
  durationMs: number;
  exitCode: number | null;
}

/** Collects all package.json paths from root and workspace directories. */
function collectPackageJsonPaths(cwd: string): string[] {
  const paths: string[] = [];
  const rootPkgPath = join(cwd, "package.json");
  if (!existsSync(rootPkgPath)) return paths;
  paths.push(rootPkgPath);

  // Expand workspace globs from root package.json
  try {
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, "utf-8"));
    const workspaces: string[] = rootPkg.workspaces ?? [];
    for (const pattern of workspaces) {
      const baseDir = pattern.replace(/\*.*$/, "").replace(/\/$/, "");
      const fullDir = join(cwd, baseDir);
      if (!existsSync(fullDir)) continue;
      try {
        const dirs = readdirSync(fullDir, { withFileTypes: true });
        for (const dirent of dirs) {
          if (dirent.isDirectory()) {
            const pkgFile = join(fullDir, dirent.name, "package.json");
            if (existsSync(pkgFile)) paths.push(pkgFile);
          }
        }
      } catch { /* skip */ }
    }
  } catch { /* ignore */ }

  return paths;
}

export interface CheckScript {
  name: string;
  cwd: string;
}

/** Returns npm scripts matching lint/test/build patterns across all workspace package.json files. */
export function detectCheckScripts(cwd: string = process.cwd()): CheckScript[] {
  const pkgPaths = collectPackageJsonPaths(cwd);

  const found: Map<string, string[]> = new Map();

  for (const pkgPath of pkgPaths) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const scripts: Record<string, string> = pkg.scripts ?? {};
      for (const name of Object.keys(scripts)) {
        if (CHECK_SCRIPT_PATTERNS.some((re) => re.test(name))) {
          const dir = join(pkgPath, "..");
          if (!found.has(name)) found.set(name, []);
          found.get(name)!.push(dir);
        }
      }
    } catch { /* skip unparseable */ }
  }

  // Return lint-type scripts first, then test, then build
  const ordered = ["lint", "test", "build"];
  const result: CheckScript[] = [];
  const added = new Set<string>();

  for (const key of ordered) {
    for (const [name, dirs] of found) {
      if (name.toLowerCase().includes(key) && !added.has(name)) {
        result.push({ name, cwd: dirs[0] });
        added.add(name);
      }
    }
  }
  for (const [name, dirs] of found) {
    if (!added.has(name)) {
      result.push({ name, cwd: dirs[0] });
      added.add(name);
    }
  }

  return result;
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

  for (const { name, cwd: scriptCwd } of scripts) {
    const start = Date.now();
    try {
      const result = await execa("npm", ["run", name], {
        cwd: scriptCwd,
        reject: false,
        timeout: 5 * 60 * 1000,
        stdin: "ignore",
      });
      const durationMs = Date.now() - start;
      const passed = result.exitCode === 0;
      results.push({
        script: name,
        passed,
        output: snippet(`${result.stdout}\n${result.stderr}`),
        durationMs,
        exitCode: result.exitCode ?? null,
      });
      if (!passed) break;
    } catch (err) {
      results.push({
        script: name,
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
