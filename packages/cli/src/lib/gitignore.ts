import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
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

function readJson(path: string): unknown {
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

  const pkg = has("package.json") ? (readJson(join(cwd, "package.json")) as Record<string, unknown> | null) : null;
  if (pkg) {
    types.push("Node");
    const deps = { ...((pkg.dependencies as Record<string, string>) ?? {}), ...((pkg.devDependencies as Record<string, string>) ?? {}) };
    if (deps.next) types.push("Nextjs");
    else if (deps.react) types.push("React");
  }

  if (has("manage.py") || has("requirements.txt") || has("pyproject.toml") || has("Pipfile")) {
    types.push("Python");
    if (has("manage.py")) types.push("Django");
  }

  if (has("artisan") || has("composer.json")) {
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

const COMMON_PATTERNS = [
  "# OS files",
  ".DS_Store",
  "Thumbs.db",
  "*.swp",
  "*.swo",
  "*~",
  "",
  "# IDE / Editor",
  ".idea/",
  ".vscode/",
  "*.sublime-workspace",
  "*.sublime-project",
  ".vs/",
  "*.suo",
  "*.ntvs_*",
  "",
  "# Env files",
  ".env",
  ".env.local",
  ".env.*.local",
  ".env.production",
  ".env.development",
  ".env.test",
  "",
  "# Logs",
  "*.log",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*",
  "pnpm-debug.log*",
  "",
  "# Dependencies",
  "node_modules/",
  ".pnp",
  ".pnp.js",
  ".yarn/cache",
  ".yarn/unplugged",
  ".yarn/build-state.yml",
  ".yarn/install-state.gz",
  "",
  "# Build output",
  "dist/",
  "build/",
  "*.tsbuildinfo",
  "",
  "# Runtime",
  "*.pid",
  "*.seed",
  "*.pid.lock",
];

/** Scans the directory for actual artifact folders/files that should be ignored. */
async function scanArtifacts(cwd: string): Promise<string[]> {
  const artifacts: string[] = [];
  const wellKnown: string[] = [
    "node_modules", ".env", ".env.local", "dist", "build", ".next",
    "out", "coverage", ".cache", ".turbo", ".vercel", ".venv",
    "venv", "env", "__pycache__", ".pytest_cache", ".egg-info",
    "vendor", ".git", ".gitignore", ".editorconfig",
  ];

  let entries: string[];
  try {
    entries = await readdir(cwd);
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (wellKnown.includes(entry)) {
      let isDir = false;
      try {
        isDir = (await stat(join(cwd, entry))).isDirectory();
      } catch { /* ignore */ }
      if (isDir && entry !== ".git") {
        if (!artifacts.includes(`${entry}/`)) artifacts.push(`${entry}/`);
      } else if (!isDir && !entry.startsWith(".")) {
        // skip non-hidden regular files, they're source code
      } else if (entry !== ".gitignore" && entry !== ".editorconfig") {
        if (!artifacts.includes(entry)) artifacts.push(entry);
      }
    }
  }

  return artifacts;
}

/** Extracts individual ignore patterns (non-comment, non-blank lines) from gitignore content. */
function extractPatterns(content: string): string[] {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

/** Merges new patterns into existing gitignore content, returning the merged result and what was added. */
function mergePatterns(existing: string, newPatterns: string[]): { merged: string; added: string[] } {
  const existingPatterns = new Set(extractPatterns(existing));
  const added: string[] = [];
  const sections: string[] = [];

  let currentSection = "";
  for (const line of newPatterns) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (currentSection) {
        sections.push(currentSection);
        currentSection = "";
      }
      continue;
    }
    if (trimmed.startsWith("#")) {
      if (currentSection) sections.push(currentSection);
      currentSection = trimmed + "\n";
      continue;
    }
    if (existingPatterns.has(trimmed)) {
      if (currentSection) {
        sections.push(currentSection);
        currentSection = "";
      }
      continue;
    }
    existingPatterns.add(trimmed);
    added.push(trimmed);
    currentSection += trimmed + "\n";
  }
  if (currentSection) sections.push(currentSection);

  if (added.length === 0) return { merged: existing, added: [] };

  const insert = "\n# ---- zap auto-add ----\n" + added.join("\n") + "\n";
  const merged = existing.endsWith("\n") ? existing + insert : existing + "\n" + insert;
  return { merged, added };
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
  const seen = new Set<string>();
  const sections: string[] = [];

  // Common base patterns
  const commonLines: string[] = [];
  for (const line of COMMON_PATTERNS) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      commonLines.push(line);
      continue;
    }
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    commonLines.push(line);
  }
  sections.push("# ---- common ----\n" + commonLines.join("\n"));

  // Per-project templates
  for (const type of types) {
    const content = loadTemplate(type);
    if (!content) continue;

    const lines = content.split("\n");
    const kept: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
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

  return sections.join("\n\n") + "\n";
}

/**
 * Creates or updates `.gitignore` in `cwd` based on detected project types
 * and actual directory artifacts. Returns what was added.
 */
export async function ensureOrUpdateGitignore(cwd: string = process.cwd()): Promise<GitignoreResult> {
  const path = join(cwd, ".gitignore");
  const types = detectProjectTypes(cwd);
  const artifacts = await scanArtifacts(cwd);

  // Build the full set of patterns for this project
  const fullContent = generateGitignore(types);
  const allPatterns = COMMON_PATTERNS.concat(extractPatterns(fullContent));

  // Add patterns for artifacts found on disk
  for (const a of artifacts) {
    const pattern = a.endsWith("/") ? a : a;
    if (!allPatterns.some((p) => p.trim() === pattern)) {
      allPatterns.push(pattern);
    }
  }

  if (!existsSync(path)) {
    // Create fresh
    writeFileSync(path, fullContent, "utf-8");
    const addedLines = extractPatterns(fullContent);
    return { created: true, path, types, addedLines };
  }

  // Update existing: merge in any missing patterns
  const existing = readFileSync(path, "utf-8");
  const { merged, added } = mergePatterns(existing, allPatterns);

  if (added.length === 0) {
    return { created: false, path, types, addedLines: [] };
  }

  writeFileSync(path, merged, "utf-8");
  return { created: false, path, types, addedLines: added };
}
