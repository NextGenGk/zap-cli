import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/lib/gitignore.js -> packages/cli/templates/gitignore
const TEMPLATES_DIR = join(__dirname, "..", "..", "templates", "gitignore");

export type ProjectType =
  | "Node"
  | "Nextjs"
  | "React"
  | "Python"
  | "Django"
  | "Laravel"
  | "Go"
  | "Rust"
  | "Java";

function readJson(path: string): any | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

/** Inspects the working directory and returns the detected project types, in template order. */
export function detectProjectTypes(cwd: string = process.cwd()): ProjectType[] {
  const types: ProjectType[] = [];
  const has = (name: string) => existsSync(join(cwd, name));

  const pkg = has("package.json") ? readJson(join(cwd, "package.json")) : null;
  if (pkg) {
    types.push("Node");
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    if (deps.next) types.push("Nextjs");
    else if (deps.react) types.push("React");
  }

  if (has("manage.py") || has("requirements.txt") || has("pyproject.toml") || has("Pipfile")) {
    types.push("Python");
    const reqs = has("requirements.txt") ? readFileSync(join(cwd, "requirements.txt"), "utf-8") : "";
    if (has("manage.py") || /django/i.test(reqs)) types.push("Django");
  }

  if (has("artisan") || (has("composer.json") && /laravel\/framework/.test(JSON.stringify(readJson(join(cwd, "composer.json")) ?? {})))) {
    types.push("Laravel");
  }

  if (has("go.mod")) types.push("Go");
  if (has("Cargo.toml")) types.push("Rust");
  if (has("pom.xml") || has("build.gradle") || has("build.gradle.kts")) types.push("Java");

  return types;
}

function loadTemplate(type: ProjectType): string {
  try {
    return readFileSync(join(TEMPLATES_DIR, `${type}.gitignore`), "utf-8");
  } catch {
    return "";
  }
}

/** Project-specific extra lines that aren't covered by the generic templates. */
function extraLinesFor(types: ProjectType[]): string[] {
  const extras: string[] = [];
  if (types.includes("Nextjs")) extras.push(".env.local");
  if (types.includes("Django")) extras.push("*.sqlite3");
  return extras;
}

export interface GitignoreResult {
  created: boolean;
  path: string;
  types: ProjectType[];
  addedLines: string[];
}

/**
 * Generates a merged .gitignore from bundled templates for the detected
 * project type(s). Returns the full file contents (deduplicated lines,
 * grouped by section).
 */
export function generateGitignore(types: ProjectType[]): string {
  if (types.length === 0) {
    return "# Environment\n.env\n.env.local\n\n# OS\n.DS_Store\n";
  }

  const seen = new Set<string>();
  const sections: string[] = [];

  for (const type of types) {
    const content = loadTemplate(type);
    if (!content) continue;

    const lines = content.split("\n");
    const kept: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      // Always keep blank lines and comments for readability within a section
      if (trimmed === "" || trimmed.startsWith("#")) {
        kept.push(line);
        continue;
      }
      if (seen.has(trimmed)) continue;
      seen.add(trimmed);
      kept.push(line);
    }

    sections.push(`# ---- ${type} ----\n${kept.join("\n").trim()}`);
  }

  const extras = extraLinesFor(types).filter((l) => !seen.has(l));
  if (extras.length > 0) {
    sections.push(`# ---- project-specific ----\n${extras.join("\n")}`);
  }

  return sections.join("\n\n") + "\n";
}

/**
 * Creates `.gitignore` in `cwd` if it doesn't already exist, based on
 * detected project type(s). No-ops (created: false) if one already exists.
 */
export function ensureGitignore(cwd: string = process.cwd()): GitignoreResult {
  const path = join(cwd, ".gitignore");
  const types = detectProjectTypes(cwd);

  if (existsSync(path)) {
    return { created: false, path, types, addedLines: [] };
  }

  const contents = generateGitignore(types);
  writeFileSync(path, contents, "utf-8");

  const addedLines = contents
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  return { created: true, path, types, addedLines };
}
