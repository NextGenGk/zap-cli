import { isGitRepo, softResetLastCommit, GitError } from "../lib/git.js";
import { getEffectiveConfig, markLastPushUndone } from "../lib/config.js";
import { getSyncCredentials, logUndoEvent } from "../lib/supabase.js";
import * as out from "../ui/output.js";
import * as ui from "../ui/prompts.js";

export async function undoCommand(): Promise<void> {
  const cwd = process.cwd();

  if (!(await isGitRepo(cwd))) {
    console.log(out.errorBlock("Not a git repository", "Run git init first, then zap init to connect."));
    process.exitCode = 1;
    return;
  }

  console.log(out.header("zap --undo", "undo last commit"));

  try {
    // Peek at the last commit first (non-destructive)
    const { hash, message } = await peekLastCommit(cwd);

    const proceed = await ui.confirmUndo(hash, message);
    if (!proceed) {
      console.log(out.muted("\n  Undo cancelled.\n"));
      return;
    }

    const undone = await softResetLastCommit(cwd);
    console.log(
      out.success("Commit undone — changes are staged", [
        `${undone.hash}  ${undone.message}`,
        "Your working tree still has these changes.",
      ])
    );

    const local = markLastPushUndone();
    const config = getEffectiveConfig();
    const creds = getSyncCredentials(config);
    void logUndoEvent(creds, local?.commitHash ?? undone.hash);
  } catch (err) {
    if (err instanceof GitError) {
      console.log(out.errorBlock(err.message, err.hint));
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

/** Reads the last commit's hash + message without modifying the repo. */
async function peekLastCommit(cwd: string): Promise<{ hash: string; message: string }> {
  const { simpleGit } = await import("simple-git");
  const git = simpleGit({ baseDir: cwd });
  const log = await git.log({ maxCount: 1 });
  const last = log.latest;
  if (!last) {
    throw new GitError("Nothing to undo", "This repository has no commits yet.");
  }
  return { hash: last.hash.slice(0, 7), message: last.message };
}
