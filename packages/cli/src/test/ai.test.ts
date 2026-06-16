import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { suggestCommitMessageFromFiles, generateCommitMessage, AiCommitError } from "../lib/ai.js";
import type { ChangedFile } from "../lib/git.js";

describe("ai.suggestCommitMessageFromFiles", () => {
  test("single new file produces a feat message naming the file", () => {
    const files: ChangedFile[] = [{ path: "src/auth/OTP.jsx", status: "A" }];
    const msg = suggestCommitMessageFromFiles(files);
    assert.match(msg, /^feat\(auth\): add OTP\.jsx$/);
  });

  test("single modified file produces a fix message", () => {
    const files: ChangedFile[] = [{ path: "README.md", status: "M" }];
    assert.equal(suggestCommitMessageFromFiles(files), "fix: update README.md");
  });

  test("single deleted file produces a chore message", () => {
    const files: ChangedFile[] = [{ path: "old-logo.png", status: "D" }];
    assert.equal(suggestCommitMessageFromFiles(files), "chore: remove old-logo.png");
  });

  test("multiple new files in the same scope", () => {
    const files: ChangedFile[] = [
      { path: "components/Button.tsx", status: "A" },
      { path: "components/Card.tsx", status: "A" },
    ];
    assert.equal(suggestCommitMessageFromFiles(files), "feat(components): add 2 new files");
  });

  test("mixed changes fall back to a generic chore message", () => {
    const files: ChangedFile[] = [
      { path: "src/App.jsx", status: "M" },
      { path: "assets/logo.svg", status: "A" },
      { path: "old-logo.png", status: "D" },
    ];
    assert.equal(suggestCommitMessageFromFiles(files), "chore: update 3 files");
  });

  test("empty file list falls back to a generic message", () => {
    assert.equal(suggestCommitMessageFromFiles([]), "chore: update files");
  });

  test("generic top-level dirs (src, lib, etc.) are not used as scopes", () => {
    const files: ChangedFile[] = [{ path: "src/index.ts", status: "A" }];
    assert.equal(suggestCommitMessageFromFiles(files), "feat: add index.ts");
  });
});

describe("ai.generateCommitMessage", () => {
  test("throws AiCommitError with reason 'no-key' when no API key is provided", async () => {
    await assert.rejects(
      () => generateCommitMessage("diff --git a/x b/x\n+hello", undefined),
      (err: unknown) => err instanceof AiCommitError && err.reason === "no-key"
    );
  });

  test("throws AiCommitError with reason 'empty-diff' for an empty diff", async () => {
    await assert.rejects(
      () => generateCommitMessage("   \n  ", "fake-key"),
      (err: unknown) => err instanceof AiCommitError && err.reason === "empty-diff"
    );
  });
});
