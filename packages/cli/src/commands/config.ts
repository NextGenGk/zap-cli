import { getConfig, setConfigValue, resetConfig, configFilePath, type CheckMode } from "../lib/config.js";
import * as out from "../ui/output.js";
import * as ui from "../ui/prompts.js";

export interface ConfigOptions {
  show?: boolean;
  check?: string;
  ai?: string;
  warnMain?: string;
  reset?: boolean;
}

const VALID_CHECK_MODES: CheckMode[] = ["always", "never", "ask"];
const VALID_TOGGLES = ["on", "off"];

export async function configCommand(options: ConfigOptions = {}): Promise<void> {
  const noFlags =
    !options.show && !options.check && !options.ai && !options.warnMain && !options.reset;

  if (options.reset) {
    if (await ui.confirm("Reset all local zap configuration?", false)) {
      resetConfig();
      console.log(out.success("Configuration reset to defaults"));
    } else {
      console.log(out.muted("\n  Reset cancelled.\n"));
    }
    return;
  }

  let changed = false;

  if (options.check !== undefined) {
    if (!VALID_CHECK_MODES.includes(options.check as CheckMode)) {
      console.log(out.errorBlock(`Invalid value for --check: ${options.check}`, "Use one of: always, never, ask"));
      process.exitCode = 1;
      return;
    }
    setConfigValue("checkMode", options.check as CheckMode);
    console.log(out.info(`Pre-push check mode set to "${options.check}"`));
    changed = true;
  }

  if (options.ai !== undefined) {
    if (!VALID_TOGGLES.includes(options.ai)) {
      console.log(out.errorBlock(`Invalid value for --ai: ${options.ai}`, "Use one of: on, off"));
      process.exitCode = 1;
      return;
    }
    setConfigValue("aiDefault", options.ai === "on");
    console.log(out.info(`AI commit messages ${options.ai === "on" ? "enabled" : "disabled"} by default`));
    changed = true;
  }

  if (options.warnMain !== undefined) {
    if (!VALID_TOGGLES.includes(options.warnMain)) {
      console.log(out.errorBlock(`Invalid value for --warn-main: ${options.warnMain}`, "Use one of: on, off"));
      process.exitCode = 1;
      return;
    }
    setConfigValue("warnMain", options.warnMain === "on");
    console.log(out.info(`Main branch warning ${options.warnMain === "on" ? "enabled" : "disabled"}`));
    changed = true;
  }

  if (options.show || noFlags || !changed) {
    printConfig();
  }
}

function printConfig(): void {
  const config = getConfig();
  console.log(out.header("zap config", "current settings"));
  const rows: [string, string][] = [
    ["initialized", String(config.initialized)],
    ["check mode", config.checkMode],
    ["ai default", String(config.aiDefault)],
    ["warn on main/master", String(config.warnMain)],
    ["default branch", config.defaultBranch],
    ["dashboard connected", config.zapApiKey ? "yes" : "no"],
    ["AI key configured", config.groqApiKey ? "yes" : "no"],
  ];
  for (const [key, value] of rows) {
    console.log(`  ${out.muted(out.pad(key, 22))}${value}`);
  }
  console.log(`\n  ${out.muted(`config file: ${configFilePath()}`)}\n`);
}
