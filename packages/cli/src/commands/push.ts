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
  pushBranch,
  getDiff,
  createAndCheckoutBranch,
  getRepoContext,
  GitError,
  type ChangedFile,
} from "../lib/git.js";
import { generateCommitMessage, suggestCommitMessageFromFiles, AiCommitError } from "../lib/ai.js";
import { getEffectiveConfig, addPushLogEntry, type CheckMode } from "../lib/config.js";
import {
  getSyncCredentials,
  logPushEvent,
  generateAiCommitMessage,
  DashboardAiError,
  type SyncCredentials,
} from "../lib/supabase.js";
import { detectCheckScripts, runPrePushChecks, type CheckScript } from "../lib/lint.js";
import * as out from "../ui/output.js";
import * as ui from "../ui/prompts.js";
import { ensureOrUpdateGitignore } from "../lib/gitignore.js";
import { randomUUID } from "node:crypto";

export interface PushOptions {
  ai?: boolean;
  remote?: string;
  dryRun?: boolean;
  check?: boolean;
  skipCheck?: boolean;
}

const PROTECTED_BRANCHES = new Set(["main", "master"]);

export async function pushCommand(options: PushOptions = {}): Promise<void> {
  const start = Date.now();
  const cwd = process.cwd();
  const dry = !!options.dryRun;

  // 1. Must be a git repo
  if (!(await isGitRepo(cwd))) {
    console.log(out.errorBlock("Not a git repository", "Run git init first, then zap init to connect."));
    process.exitCode = 1;
    return;
  }

  // Auto-generate or update .gitignore (skip during dry-run)
  if (!dry) {
    const gi = await ensureOrUpdateGitignore(cwd);
    if (gi.created) {
      console.log(out.info(`Generated .gitignore (${gi.types.join(", ") || "generic"})`));
    } else if (gi.addedLines.length > 0) {
      console.log(out.info(`Updated .gitignore (+${gi.addedLines.length} patterns)`));
    }
  }

  // 2. Must have changes
  const status = await getStatus(cwd);
  if (!hasChanges(status)) {
    console.log(out.errorBlock("Nothing to commit", "No changes detected in this directory."));
    process.exitCode = 1;
    return;
  }

  const files = summarizeChangedFiles(status);
  let branch = await getCurrentBranch(cwd);

  // 3. Main branch warning -- resolved before printing the header so the
  // header reflects the branch we'll actually push to.
  const config = getEffectiveConfig();
  if (config.warnMain && PROTECTED_BRANCHES.has(branch)) {
    if (dry) {
      console.log(
        out.warningBlock(
          `[DRY RUN] Would warn before pushing to ${branch}`,
          "You could create a new branch instead of pushing directly (not simulated here)."
        )
      );
    } else {
      const proceed = await ui.confirmMainBranchPush(branch);
      if (!proceed) {
        const newBranch = await ui.promptCreateBranchInstead(branch);
        if (!newBranch) {
          console.log(out.muted("\n  Push cancelled.\n"));
          return;
        }
        try {
          await createAndCheckoutBranch(newBranch, cwd);
        } catch (err) {
          if (err instanceof GitError) {
            console.log(out.errorBlock(err.message, err.hint));
            process.exitCode = 1;
            return;
          }
          throw err;
        }
        branch = newBranch;
        console.log(out.info(`Created and switched to ${branch}`));
      }
    }
  }

  // 4. Display changed files
  const useAi = options.ai || config.aiDefault;
  console.log(
    out.header(
      dry ? "zap --dry-run" : useAi ? "zap --ai" : "zap",
      `${files.length} file${files.length === 1 ? "" : "s"} changed on ${branch}`
    )
  );
  console.log(dry ? out.dryRunFileList(files) : out.fileList(files));

  // 5/6. Commit message
  const creds = getSyncCredentials(config);
  let commitMessage: string;
  let usedAi = false;

  if (dry) {
    commitMessage = useAi
      ? "feat(scope): <AI-generated message> (skipped in dry run)"
      : suggestCommitMessageFromFiles(files);
    console.log(`\n  ${out.muted("[DRY RUN]")} ${out.commitMsgBlock(commitMessage, useAi ? out.aiBadge() : undefined)}`);
  } else if (useAi) {
    const result = await runAiFlow(cwd, files, creds, config.groqApiKey);
    commitMessage = result.message;
    usedAi = result.usedAi;
  } else {
    const suggestion = suggestCommitMessageFromFiles(files);
    const choice = await ui.commitMessagePrompt(suggestion);
    commitMessage = choice.action === "edit" ? choice.message : suggestion;
  }

  // --check / pre-push checks
  if (!(await runChecksIfNeeded(cwd, options, config.checkMode, dry))) {
    return; // checks failed, push blocked
  }

  if (dry) {
    console.log(out.step(`[DRY RUN] Would stage all changes, commit, and push to ${branch}`));
    console.log(out.success(`[DRY RUN] Done — nothing was pushed`, [
      `branch: ${branch}`,
      `commit message: ${commitMessage}`,
      `files: ${files.length}`,
    ]));
    return;
  }

  // 7. Stage, commit, push
  const remoteName = options.remote || "origin";
  try {
    await stageAll(cwd);
    const commit = await commitChanges(commitMessage, cwd);

    const spin = ui.spinner();
    spin.start(`Pushing to ${branch}...`);
    try {
      await pushBranch(branch, remoteName, cwd);
    } catch (err) {
      spin.stop(`Push failed`);
      throw err;
    }
    spin.stop(`Pushed to ${remoteName}/${branch}`);

    // 8. Success output
    const durationMs = Date.now() - start;
    const remote = await getRemoteUrl(cwd, remoteName);
    const details = [`commit ${commit.hash}`];
    if (remote) {
      details.push(`${remoteUrlToHttps(remote)}/commit/${commit.hash}`);
    }
    console.log(out.success(`Done in ${(durationMs / 1000).toFixed(1)}s`, details));

    // 9. Local + remote logging
    addPushLogEntry({
      id: randomUUID(),
      repo: remote ? remoteUrlToHttps(remote) : cwd,
      branch,
      commitMsg: commitMessage,
      commitHash: commit.hash,
      filesChanged: files.length,
      usedAi,
      undone: false,
      durationMs,
      createdAt: new Date().toISOString(),
    });

    const syncWarnings: string[] = [];
    if (creds) {
      const pushOk = await logPushEvent(creds, {
        repoUrl: remote ? remoteUrlToHttps(remote) : null,
        branch,
        commitHash: commit.hash,
        commitMsg: commitMessage,
        filesChanged: files.length,
        usedAi,
        durationMs,
      });
      if (!pushOk) syncWarnings.push("Could not sync push to dashboard");
    }
    for (const w of syncWarnings) {
      console.log(`  ${out.colors.warning("⚠")}  ${out.colors.muted(w)}`);
    }
  } catch (err) {
    if (err instanceof GitError) {
      console.log(out.errorBlock(err.message, err.hint));
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

interface AiFlowResult {
  message: string;
  usedAi: boolean;
  tokensUsed: number;
  model: string;
}

/**
 * Runs the `zap --ai` commit-message generation flow with regenerate support.
 *
 * Provider order:
 *  1. The connected zap dashboard (`/api/ai/commit-message`) — the default
 *     SaaS path. Uses the platform's own Groq API key, so the user never
 *     needs to provide one.
 *  2. A local `GROQ_API_KEY` (advanced/self-hosted override), if set.
 *  3. A heuristic, file-based suggestion — AI never blocks a push.
 */
async function runAiFlow(
  cwd: string,
  files: ChangedFile[],
  creds: SyncCredentials | null,
  groqApiKey: string
): Promise<AiFlowResult> {
  const fallback = suggestCommitMessageFromFiles(files);

  while (true) {
    let diff = await getDiff(true, cwd);
    if (!diff.trim()) diff = await getDiff(false, cwd);
    if (!diff.trim() && files.length > 0) {
      diff = files.map((f) => `${f.status === "A" ? "+++" : f.status === "D" ? "---" : "  "} ${f.path}`).join("\n");
    }

    const ctx = await getRepoContext(cwd);
    const contextParts: string[] = [];
    if (ctx.fileTree) contextParts.push(`## Repository files\n\`\`\`\n${ctx.fileTree}\n\`\`\``);
    if (ctx.packageJson) contextParts.push(`## package.json\n\`\`\`json\n${ctx.packageJson}\n\`\`\``);
    if (ctx.readme) contextParts.push(`## README\n${ctx.readme}`);
    const enrichedDiff = contextParts.length > 0
      ? `Project context:\n${contextParts.join("\n\n")}\n\nGit diff:\n${diff}`
      : diff;

    const spin = ui.spinner();
    spin.start("Generating commit message with zap ai...");

    let generated: { message: string; tokensUsed: number; model: string } | null = null;
    let failureHint: string | null = null;

    if (creds) {
      try {
        const result = await generateAiCommitMessage(creds, enrichedDiff);
        generated = { message: result.message, tokensUsed: result.tokensUsed, model: result.model };
      } catch (err) {
        const reason = err instanceof DashboardAiError ? err.reason : "api-error";
        const msg = err instanceof Error ? err.message : String(err);
        failureHint =
          reason === "no-server-key"
            ? "AI not enabled on this dashboard (server missing GROQ_API_KEY)."
            : reason === "empty-diff"
              ? "No diff content to summarize."
              : `Dashboard error: ${msg}`;
      }
    }

    if (!generated && groqApiKey) {
      try {
        const result = await generateCommitMessage(enrichedDiff, groqApiKey);
        generated = { message: result.message, tokensUsed: result.tokensUsed, model: result.model };
        failureHint = null;
      } catch (err) {
        const reason = err instanceof AiCommitError ? err.reason : "api-error";
        const msg = err instanceof Error ? err.message : String(err);
        if (!failureHint) {
          failureHint = reason === "empty-diff" ? "No diff content to summarize." : `${msg}`;
        }
      }
    }

    if (!generated && !creds && !groqApiKey) {
      failureHint = "Connect to the zap dashboard for AI commit messages: run `zap init`.";
    }

    if (generated) {
      spin.stop("Generated commit message");
      const choice = await ui.commitMessagePrompt(generated.message, {
        label: "AI suggestion",
        allowRegenerate: true,
      });

      if (choice.action === "regenerate") continue;
      if (choice.action === "edit") {
        return { message: choice.message, usedAi: true, tokensUsed: generated.tokensUsed, model: generated.model };
      }
      return { message: generated.message, usedAi: true, tokensUsed: generated.tokensUsed, model: generated.model };
    }

    spin.stop("AI commit message unavailable");
    console.log(out.errorBlock("Couldn't generate an AI commit message", failureHint ?? undefined));

    const choice = await ui.commitMessagePrompt(fallback);
    const message = choice.action === "edit" ? choice.message : fallback;
    return { message, usedAi: false, tokensUsed: 0, model: "" };
  }
}

/**
 * Resolves whether pre-push checks should run, runs them if so, and prints
 * pass/fail output. Returns false if the push should be blocked.
 */
async function runChecksIfNeeded(
  cwd: string,
  options: PushOptions,
  checkMode: CheckMode,
  dry: boolean
): Promise<boolean> {
  if (options.skipCheck) return true;

  const scripts: CheckScript[] = detectCheckScripts(cwd);
  if (scripts.length === 0) {
    if (options.check) {
      console.log(out.warningBlock("No check scripts found", "No lint, test, or build scripts detected in package.json. Use --skip-check to silence."));
    }
    return true;
  }

  const scriptNames = scripts.map((s) => s.name);

  let shouldRun = false;
  if (options.check) shouldRun = true;
  else if (checkMode === "always") shouldRun = true;
  else if (checkMode === "never") shouldRun = false;
  else {
    // "ask"
    if (dry) {
      console.log(out.info(`[DRY RUN] Would ask to run checks: ${scriptNames.join(", ")}`));
      return true;
    }
    shouldRun = await ui.confirm(`Run pre-push checks (${scriptNames.join(", ")})?`, true);
  }

  if (!shouldRun) return true;

  if (dry) {
    console.log(out.info(`[DRY RUN] Would run: ${scriptNames.join(", ")}`));
    return true;
  }

  const spin = ui.spinner();
  spin.start(`Running checks: ${scriptNames.join(", ")}...`);
  const results = await runPrePushChecks(cwd);
  const failed = results.find((r) => !r.passed);

  if (!failed) {
    spin.stop(`Checks passed (${results.map((r) => r.script).join(", ")})`);
    return true;
  }

  spin.stop(`${failed.script} failed`);
  console.log(out.errorBlock(`${failed.script} check failed`, "Fix errors or run: zap --skip-check to push anyway."));
  if (failed.output) {
    console.log(out.muted(failed.output.split("\n").map((l) => `     ${l}`).join("\n")));
  }
  process.exitCode = 1;
  return false;
}
