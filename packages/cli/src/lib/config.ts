import Conf from "conf";

export type CheckMode = "always" | "never" | "ask";

export interface PushLogEntry {
  id: string;
  repo: string;
  branch: string;
  commitMsg: string;
  commitHash: string;
  filesChanged: number;
  usedAi: boolean;
  undone: boolean;
  durationMs: number;
  createdAt: string;
}

export interface ZapConfigSchema {
  initialized: boolean;
  checkMode: CheckMode;
  aiDefault: boolean;
  warnMain: boolean;
  defaultBranch: string;
  zapApiKey: string;
  zapSupabaseUrl: string;
  groqApiKey: string;
  pushLog: PushLogEntry[];
}

const defaults: ZapConfigSchema = {
  initialized: false,
  checkMode: "ask",
  aiDefault: false,
  warnMain: true,
  defaultBranch: "main",
  zapApiKey: "",
  zapSupabaseUrl: "",
  groqApiKey: "",
  pushLog: [],
};

let _store: Conf<ZapConfigSchema> | null = null;

/** Lazily create the underlying conf store (keeps tests/dry-runs cheap). */
export function getStore(): Conf<ZapConfigSchema> {
  if (!_store) {
    _store = new Conf<ZapConfigSchema>({
      projectName: "zap-git",
      defaults,
    });
  }
  return _store;
}

export function getConfig(): ZapConfigSchema {
  const store = getStore();
  return {
    initialized: store.get("initialized"),
    checkMode: store.get("checkMode"),
    aiDefault: store.get("aiDefault"),
    warnMain: store.get("warnMain"),
    defaultBranch: store.get("defaultBranch"),
    zapApiKey: store.get("zapApiKey"),
    zapSupabaseUrl: store.get("zapSupabaseUrl"),
    groqApiKey: store.get("groqApiKey"),
    pushLog: store.get("pushLog"),
  };
}

export function setConfigValue<K extends keyof ZapConfigSchema>(
  key: K,
  value: ZapConfigSchema[K]
): void {
  getStore().set(key, value);
}

export function resetConfig(): void {
  getStore().clear();
}

export function configFilePath(): string {
  return getStore().path;
}

/** Prepend a push event to the local log, capped at 50 entries. */
export function addPushLogEntry(entry: PushLogEntry): void {
  const store = getStore();
  const log = store.get("pushLog");
  log.unshift(entry);
  store.set("pushLog", log.slice(0, 50));
}

/** Mark the most recent push as undone (used by `zap --undo`). */
export function markLastPushUndone(): PushLogEntry | undefined {
  const store = getStore();
  const log = store.get("pushLog");
  const last = log.find((entry) => !entry.undone);
  if (last) {
    last.undone = true;
    store.set("pushLog", log);
  }
  return last;
}

export function getPushLog(limit = 20): PushLogEntry[] {
  return getStore().get("pushLog").slice(0, limit);
}

/**
 * Returns config with environment variables (GROQ_API_KEY, ZAP_API_KEY,
 * ZAP_SUPABASE_URL) taking precedence over locally stored values, per the
 * documented env var contract.
 */
export function getEffectiveConfig(): ZapConfigSchema {
  const config = getConfig();
  return {
    ...config,
    groqApiKey: process.env.GROQ_API_KEY || config.groqApiKey,
    zapApiKey: process.env.ZAP_API_KEY || config.zapApiKey,
    zapSupabaseUrl: process.env.ZAP_SUPABASE_URL || config.zapSupabaseUrl,
  };
}

