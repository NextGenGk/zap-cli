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
  stageAll,
  commitChanges,
  pushBranch,
  GitError,
} from "../lib/git.js";
import { suggestCommitMessageFromFiles } from "../lib/ai.js";
import { ensureGitignore } from "../lib/gitignore.js";

/**
 * Sets up a bare "remote" repo plus a working repo with `origin` pointing at
 * it, so `pushBranch` exercises a real push over the filesystem.
 */
function setupRepoWithRemote(): { workDir: string; remoteDir: string } {
  const remoteDir = mkdtempSync(join(tmpdir(), "zap-remote-"));
  execSync("git init -q --bare", { cwd: remoteDir });

  const workDir = mkdtempSync(join(tmpdir(), "zap-work-"));
  execSync("git init -q -b main", { cwd: workDir });
  execSync('git config user.name "Test"', { cwd: workDir });
  execSync('git config user.email "test@example.com"', { cwd: workDir });
  execSync(`git remote add origin ${remoteDir}`, { cwd: workDir });

  return { workDir, remoteDir };
}

describe("full push flow (integration)", () => {
  test("end-to-end: detect changes -> auto-suggest message -> stage -> commit -> push", async () => {
    const { workDir, remoteDir } = setupRepoWithRemote();

    // Simulate a developer's changes: a new component and an updated README
    writeFileSync(join(workDir, "README.md"), "# my project\n");
    await stageAll(workDir);
    await commitChanges("chore: initial commit", workDir);
    await pushBranch("main", workDir);

    writeFileSync(join(workDir, "README.md"), "# my project\n\nUpdated docs.\n");
    writeFileSync(join(workDir, "feature.js"), "export const feature = true;\n");

    // 1. repo check
    assert.equal(await isGitRepo(workDir), true);

    // 2. change detection
    const status = await getStatus(workDir);
    assert.equal(hasChanges(status), true);

    // 3. changed files summary
    const files = summarizeChangedFiles(status);
    assert.deepEqual(
      files.map((f) => f.path).sort(),
      ["README.md", "feature.js"]
    );

    // 4. branch + 5. suggested commit message
    const branch = await getCurrentBranch(workDir);
    assert.equal(branch, "main");
    const message = suggestCommitMessageFromFiles(files);
    assert.equal(message, "chore: update 2 files");

    // 6/7. stage, commit, push
    await stageAll(workDir);
    const commit = await commitChanges(message, workDir);
    assert.match(commit.hash, /^[0-9a-f]{7}$/);
    await pushBranch(branch, workDir);

    // Verify the remote actually received the commit
    const remoteLog = execSync("git log --oneline -1 main", { cwd: remoteDir }).toString().trim();
    assert.match(remoteLog, /chore: update 2 files/);

    // 8. status is clean after push
    const finalStatus = await getStatus(workDir);
    assert.equal(hasChanges(finalStatus), false);

    rmSync(workDir, { recursive: true, force: true });
    rmSync(remoteDir, { recursive: true, force: true });
  });

  test("push without a configured remote raises a GitError with a helpful hint", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "zap-noremote-"));
    execSync("git init -q -b main", { cwd: workDir });
    execSync('git config user.name "Test"', { cwd: workDir });
    execSync('git config user.email "test@example.com"', { cwd: workDir });

    writeFileSync(join(workDir, "a.txt"), "a");
    await stageAll(workDir);
    await commitChanges("chore: first commit", workDir);

    await assert.rejects(
      () => pushBranch("main", workDir),
      (err: unknown) => err instanceof GitError && /No remote configured/.test(err.message)
    );

    assert.equal(await getRemoteUrl(workDir), null);

    rmSync(workDir, { recursive: true, force: true });
  });

  test("a clean repo with no changes is correctly detected as 'nothing to commit'", async () => {
    const { workDir, remoteDir } = setupRepoWithRemote();
    writeFileSync(join(workDir, "a.txt"), "a");
    await stageAll(workDir);
    await commitChanges("chore: init", workDir);

    const status = await getStatus(workDir);
    assert.equal(hasChanges(status), false);

    rmSync(workDir, { recursive: true, force: true });
    rmSync(remoteDir, { recursive: true, force: true });
  });

  test(".gitignore is auto-generated for a Node project before the first commit", async () => {
    const { workDir, remoteDir } = setupRepoWithRemote();
    writeFileSync(join(workDir, "package.json"), JSON.stringify({ name: "x", dependencies: { express: "^4.0.0" } }));
    writeFileSync(join(workDir, "index.js"), "console.log('hi')");

    const result = ensureGitignore(workDir);
    assert.equal(result.created, true);
    assert.deepEqual(result.types, ["Node"]);

    await stageAll(workDir);
    const commit = await commitChanges("feat: initial implementation", workDir);
    await pushBranch("main", workDir);
    assert.ok(commit.hash);

    rmSync(workDir, { recursive: true, force: true });
    rmSync(remoteDir, { recursive: true, force: true });
  });
});
