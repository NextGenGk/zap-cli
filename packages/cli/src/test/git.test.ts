import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import {
  isGitRepo,
  getStatus,
  summarizeChangedFiles,
  hasChanges,
  getCurrentBranch,
  getRemoteUrl,
  remoteUrlToHttps,
  stageAll,
  commitChanges,
  softResetLastCommit,
  GitError,
} from "../lib/git.js";

function initRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "zap-git-test-"));
  execSync("git init -q", { cwd: dir });
  execSync('git config user.name "Test"', { cwd: dir });
  execSync('git config user.email "test@example.com"', { cwd: dir });
  return dir;
}

describe("git lib", () => {
  test("isGitRepo returns false for a non-repo directory", async () => {
    const dir = mkdtempSync(join(tmpdir(), "zap-not-a-repo-"));
    assert.equal(await isGitRepo(dir), false);
    rmSync(dir, { recursive: true, force: true });
  });

  test("isGitRepo returns true for an initialized repo", async () => {
    const dir = initRepo();
    assert.equal(await isGitRepo(dir), true);
    rmSync(dir, { recursive: true, force: true });
  });

  test("hasChanges is false for a clean repo, true after adding a file", async () => {
    const dir = initRepo();
    writeFileSync(join(dir, "README.md"), "# hello\n");
    const status = await getStatus(dir);
    assert.equal(hasChanges(status), true);
    rmSync(dir, { recursive: true, force: true });
  });

  test("summarizeChangedFiles maps created/modified/deleted files correctly", async () => {
    const dir = initRepo();
    writeFileSync(join(dir, "a.txt"), "a");
    writeFileSync(join(dir, "b.txt"), "b");
    await stageAll(dir);
    await commitChanges("chore: initial files", dir);

    // modify a, delete b, add c
    writeFileSync(join(dir, "a.txt"), "a2");
    execSync("git rm -q b.txt", { cwd: dir });
    writeFileSync(join(dir, "c.txt"), "c");

    const status = await getStatus(dir);
    const files = summarizeChangedFiles(status);
    const byPath = new Map(files.map((f) => [f.path, f.status]));

    assert.equal(byPath.get("a.txt"), "M");
    assert.equal(byPath.get("b.txt"), "D");
    assert.equal(byPath.get("c.txt"), "A");

    rmSync(dir, { recursive: true, force: true });
  });

  test("getCurrentBranch returns the active branch name", async () => {
    const dir = initRepo();
    writeFileSync(join(dir, "a.txt"), "a");
    await stageAll(dir);
    await commitChanges("chore: init", dir);
    execSync("git checkout -q -b feat/test-branch", { cwd: dir });

    assert.equal(await getCurrentBranch(dir), "feat/test-branch");
    rmSync(dir, { recursive: true, force: true });
  });

  test("getRemoteUrl returns null when no remote is configured, the URL when one is", async () => {
    const dir = initRepo();
    assert.equal(await getRemoteUrl(dir), null);

    execSync("git remote add origin https://github.com/acme/widgets.git", { cwd: dir });
    assert.equal(await getRemoteUrl(dir), "https://github.com/acme/widgets.git");

    rmSync(dir, { recursive: true, force: true });
  });

  test("remoteUrlToHttps converts SSH and HTTPS remotes", () => {
    assert.equal(remoteUrlToHttps("git@github.com:acme/widgets.git"), "https://github.com/acme/widgets");
    assert.equal(remoteUrlToHttps("https://github.com/acme/widgets.git"), "https://github.com/acme/widgets");
    assert.equal(remoteUrlToHttps("ssh://git@github.com/acme/widgets.git"), "https://github.com/acme/widgets");
  });

  test("commitChanges creates a commit and returns a short hash", async () => {
    const dir = initRepo();
    writeFileSync(join(dir, "a.txt"), "a");
    await stageAll(dir);
    const result = await commitChanges("feat: add a.txt", dir);

    assert.match(result.hash, /^[0-9a-f]{7}$/);
    assert.equal(result.message, "feat: add a.txt");

    rmSync(dir, { recursive: true, force: true });
  });

  test("softResetLastCommit undoes the most recent commit but keeps changes staged", async () => {
    const dir = initRepo();
    writeFileSync(join(dir, "a.txt"), "a");
    await stageAll(dir);
    await commitChanges("chore: first commit", dir);

    writeFileSync(join(dir, "b.txt"), "b");
    await stageAll(dir);
    const second = await commitChanges("feat: add b.txt", dir);

    const undone = await softResetLastCommit(dir);
    assert.equal(undone.hash, second.hash);
    assert.equal(undone.message, "feat: add b.txt");

    const status = await getStatus(dir);
    assert.ok(status.staged.includes("b.txt"));

    rmSync(dir, { recursive: true, force: true });
  });

  test("softResetLastCommit refuses to undo the initial commit", async () => {
    const dir = initRepo();
    writeFileSync(join(dir, "a.txt"), "a");
    await stageAll(dir);
    await commitChanges("chore: only commit", dir);

    await assert.rejects(() => softResetLastCommit(dir), GitError);

    rmSync(dir, { recursive: true, force: true });
  });

  test("softResetLastCommit on a repo with no commits throws GitError", async () => {
    const dir = initRepo();
    await assert.rejects(() => softResetLastCommit(dir), GitError);
    rmSync(dir, { recursive: true, force: true });
  });
});
