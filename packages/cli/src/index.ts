#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { pushCommand } from "./commands/push.js";
import { undoCommand } from "./commands/undo.js";
import { logCommand } from "./commands/log.js";
import { initCommand } from "./commands/init.js";
import { configCommand } from "./commands/config.js";
import { getConfig } from "./lib/config.js";
import * as out from "./ui/output.js";

const program = new Command();

program
  .name("zap")
  .description("Push code. Just type zap.")
  .version("0.1.0");

program
  .option("--ai", "generate the commit message with AI (Groq)")
  .option("--dry-run", "simulate the full flow without staging, committing, or pushing")
  .option("--check", "run pre-push checks (lint/test/build) before pushing")
  .option("--skip-check", "skip pre-push checks even if configured")
  .option("--undo", "undo the last commit (soft reset, keeps changes)")
  .action(async (options) => {
    if (options.undo) {
      await undoCommand();
      return;
    }

    // First-run setup wizard, only for a bare `zap` with no flags.
    const noFlags = !options.ai && !options.dryRun && !options.check && !options.skipCheck;
    if (noFlags && !getConfig().initialized) {
      await initCommand();
      return;
    }

    await pushCommand({
      ai: !!options.ai,
      dryRun: !!options.dryRun,
      check: !!options.check,
      skipCheck: !!options.skipCheck,
    });
  });

program
  .command("log")
  .description("show recent push history")
  .option("-n, --limit <number>", "number of entries to show", "20")
  .action(async (options) => {
    await logCommand({ limit: Number.parseInt(options.limit, 10) || 20 });
  });

program
  .command("init")
  .description("run the first-time setup wizard")
  .action(async () => {
    await initCommand();
  });

program
  .command("config")
  .description("view or update local CLI configuration")
  .option("--show", "show all current configuration")
  .option("--check <mode>", "pre-push check behavior: always | never | ask")
  .option("--ai <state>", "default AI mode: on | off")
  .option("--warn-main <state>", "main branch warning: on | off")
  .option("--reset", "reset all configuration to defaults")
  .action(async (options) => {
    await configCommand({
      show: !!options.show,
      check: options.check,
      ai: options.ai,
      warnMain: options.warnMain,
      reset: !!options.reset,
    });
  });

program.exitOverride((err) => {
  // commander throws on --help/--version too; only treat real errors as failures
  if (err.exitCode !== 0 && err.code !== "commander.helpDisplayed" && err.code !== "commander.version") {
    process.exitCode = err.exitCode || 1;
  }
  if (err.code === "commander.helpDisplayed" || err.code === "commander.help" || err.code === "commander.version") {
    process.exit(0);
  }
});

try {
  await program.parseAsync(process.argv);
} catch (err) {
  if (err instanceof Error) {
    console.log(out.errorBlock("Unexpected error", err.message));
    process.exitCode = 1;
  } else {
    throw err;
  }
}
