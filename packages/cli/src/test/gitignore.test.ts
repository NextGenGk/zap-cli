import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectProjectTypes, generateGitignore, ensureGitignore } from "../lib/gitignore.js";

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), "zap-gitignore-test-"));
}

describe("gitignore detection", () => {
  test("detects a plain Node project", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: {} }));
    assert.deepEqual(detectProjectTypes(dir), ["Node"]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("detects a Next.js project from dependencies", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { next: "15.0.0", react: "19.0.0" } }));
    assert.deepEqual(detectProjectTypes(dir), ["Node", "Nextjs"]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("detects a React project from dependencies", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { react: "19.0.0" } }));
    assert.deepEqual(detectProjectTypes(dir), ["Node", "React"]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("detects a Django project from manage.py", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "manage.py"), "# django manage.py");
    assert.deepEqual(detectProjectTypes(dir), ["Python", "Django"]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("detects Go and Rust projects", () => {
    const goDir = tmpDir();
    writeFileSync(join(goDir, "go.mod"), "module example.com/x");
    assert.deepEqual(detectProjectTypes(goDir), ["Go"]);
    rmSync(goDir, { recursive: true, force: true });

    const rustDir = tmpDir();
    writeFileSync(join(rustDir, "Cargo.toml"), "[package]\nname = \"x\"");
    assert.deepEqual(detectProjectTypes(rustDir), ["Rust"]);
    rmSync(rustDir, { recursive: true, force: true });
  });

  test("returns empty array when nothing is detected", () => {
    const dir = tmpDir();
    assert.deepEqual(detectProjectTypes(dir), []);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("gitignore generation", () => {
  test("generateGitignore for Node includes node_modules and .env", () => {
    const content = generateGitignore(["Node"]);
    assert.match(content, /node_modules\//);
    assert.match(content, /\.env/);
  });

  test("generateGitignore for Nextjs includes .next and .env.local extra", () => {
    const content = generateGitignore(["Node", "Nextjs"]);
    assert.match(content, /\.next\//);
    assert.match(content, /\.env\.local/);
  });

  test("generateGitignore deduplicates lines shared across templates", () => {
    const content = generateGitignore(["Node", "Nextjs"]);
    const envLines = content.split("\n").filter((l) => l.trim() === ".env");
    assert.equal(envLines.length, 1);
  });

  test("generateGitignore falls back to a generic template when no types are detected", () => {
    const content = generateGitignore([]);
    assert.match(content, /\.env/);
    assert.match(content, /\.DS_Store/);
  });
});

describe("ensureGitignore", () => {
  test("creates a .gitignore when none exists", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { next: "15.0.0" } }));

    const result = ensureGitignore(dir);
    assert.equal(result.created, true);
    assert.ok(existsSync(join(dir, ".gitignore")));
    assert.deepEqual(result.types, ["Node", "Nextjs"]);

    rmSync(dir, { recursive: true, force: true });
  });

  test("does not overwrite an existing .gitignore", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, ".gitignore"), "custom-ignore\n");

    const result = ensureGitignore(dir);
    assert.equal(result.created, false);
    assert.equal(readFileSync(join(dir, ".gitignore"), "utf-8"), "custom-ignore\n");

    rmSync(dir, { recursive: true, force: true });
  });
});
