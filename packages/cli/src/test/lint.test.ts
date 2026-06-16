import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectCheckScripts, runPrePushChecks } from "../lib/lint.js";

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), "zap-lint-test-"));
}

describe("detectCheckScripts", () => {
  test("returns lint, test, build in priority order when all are present", () => {
    const dir = tmpDir();
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ scripts: { build: "echo build", test: "echo test", lint: "echo lint" } })
    );
    assert.deepEqual(detectCheckScripts(dir), ["lint", "test", "build"]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("returns only the scripts that exist", () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: { test: "echo test" } }));
    assert.deepEqual(detectCheckScripts(dir), ["test"]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("returns an empty array when there is no package.json", () => {
    const dir = tmpDir();
    assert.deepEqual(detectCheckScripts(dir), []);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("runPrePushChecks", () => {
  test("reports success when the script exits 0", async () => {
    const dir = tmpDir();
    writeFileSync(join(dir, "package.json"), JSON.stringify({ scripts: { lint: "node -e \"console.log('ok')\"" } }));

    const results = await runPrePushChecks(dir);
    assert.equal(results.length, 1);
    assert.equal(results[0].script, "lint");
    assert.equal(results[0].passed, true);

    rmSync(dir, { recursive: true, force: true });
  });

  test("stops at the first failing script and reports failure", async () => {
    const dir = tmpDir();
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({
        scripts: {
          lint: "node -e \"process.exit(1)\"",
          test: "node -e \"console.log('should not run')\"",
        },
      })
    );

    const results = await runPrePushChecks(dir);
    assert.equal(results.length, 1);
    assert.equal(results[0].script, "lint");
    assert.equal(results[0].passed, false);

    rmSync(dir, { recursive: true, force: true });
  });
});
