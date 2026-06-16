import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  getConfig,
  setConfigValue,
  resetConfig,
  addPushLogEntry,
  markLastPushUndone,
  getPushLog,
  getEffectiveConfig,
} from "../lib/config.js";

describe("config", () => {
  beforeEach(() => {
    resetConfig();
  });

  test("defaults are sane", () => {
    const config = getConfig();
    assert.equal(config.initialized, false);
    assert.equal(config.checkMode, "ask");
    assert.equal(config.aiDefault, false);
    assert.equal(config.warnMain, true);
    assert.equal(config.defaultBranch, "main");
    assert.deepEqual(config.pushLog, []);
  });

  test("setConfigValue persists and getConfig reflects it", () => {
    setConfigValue("checkMode", "always");
    setConfigValue("aiDefault", true);
    setConfigValue("warnMain", false);

    const config = getConfig();
    assert.equal(config.checkMode, "always");
    assert.equal(config.aiDefault, true);
    assert.equal(config.warnMain, false);
  });

  test("resetConfig restores defaults", () => {
    setConfigValue("checkMode", "never");
    resetConfig();
    assert.equal(getConfig().checkMode, "ask");
  });

  test("addPushLogEntry prepends entries, most recent first", () => {
    addPushLogEntry({
      id: "1",
      repo: "https://github.com/acme/widgets",
      branch: "main",
      commitMsg: "chore: first",
      commitHash: "aaa1111",
      filesChanged: 1,
      usedAi: false,
      undone: false,
      durationMs: 1000,
      createdAt: new Date().toISOString(),
    });
    addPushLogEntry({
      id: "2",
      repo: "https://github.com/acme/widgets",
      branch: "feat/x",
      commitMsg: "feat: second",
      commitHash: "bbb2222",
      filesChanged: 2,
      usedAi: true,
      undone: false,
      durationMs: 1200,
      createdAt: new Date().toISOString(),
    });

    const log = getPushLog();
    assert.equal(log.length, 2);
    assert.equal(log[0].id, "2");
    assert.equal(log[1].id, "1");
  });

  test("markLastPushUndone marks the most recent non-undone entry", () => {
    addPushLogEntry({
      id: "1",
      repo: "r",
      branch: "main",
      commitMsg: "chore: a",
      commitHash: "aaa",
      filesChanged: 1,
      usedAi: false,
      undone: false,
      durationMs: 1,
      createdAt: new Date().toISOString(),
    });

    const undone = markLastPushUndone();
    assert.equal(undone?.id, "1");
    assert.equal(getPushLog()[0].undone, true);
  });

  test("getEffectiveConfig prefers env vars over stored values", () => {
    setConfigValue("groqApiKey", "stored-key");
    setConfigValue("zapApiKey", "stored-zap-key");
    setConfigValue("zapSupabaseUrl", "https://stored.example.com");

    process.env.GROQ_API_KEY = "env-key";
    process.env.ZAP_API_KEY = "env-zap-key";
    process.env.ZAP_SUPABASE_URL = "https://env.example.com";

    const effective = getEffectiveConfig();
    assert.equal(effective.groqApiKey, "env-key");
    assert.equal(effective.zapApiKey, "env-zap-key");
    assert.equal(effective.zapSupabaseUrl, "https://env.example.com");

    delete process.env.GROQ_API_KEY;
    delete process.env.ZAP_API_KEY;
    delete process.env.ZAP_SUPABASE_URL;
  });

  test("getEffectiveConfig falls back to stored values when env vars are unset", () => {
    setConfigValue("groqApiKey", "stored-key");
    const effective = getEffectiveConfig();
    assert.equal(effective.groqApiKey, "stored-key");
  });
});
