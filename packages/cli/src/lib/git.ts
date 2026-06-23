import { simpleGit, type SimpleGit, type StatusResult } from "simple-git";

export class GitError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
    this.name = "GitError";
  }
}

export interface ChangedFile {
  path: string;
  /** Single letter status: M, A, D, R, ?, etc. */
  status: string;
}

export interface CommitInfo {
  hash: string;
  message: string;
  filesChanged: number;
}

function git(cwd: string = process.cwd()): SimpleGit {
  return simpleGit({ baseDir: cwd, timeout: { block: 15000 } });
}

/** Returns true if `cwd` is inside a git working tree. */
export async function isGitRepo(cwd?: string): Promise<boolean> {
  try {
    return await git(cwd).checkIsRepo();
  } catch {
    return false;
  }
}

/** Raw status info from simple-git. */
export async function getStatus(cwd?: string): Promise<StatusResult> {
  try {
    return await git(cwd).status();
  } catch (err) {
    throw new GitError(`Unable to read git status: ${(err as Error).message}`);
  }
}

/** Maps simple-git status output to a flat, display-friendly list. */
export function summarizeChangedFiles(status: StatusResult): ChangedFile[] {
  const files: ChangedFile[] = [];
  const seen = new Set<string>();

  const push = (path: string, statusCode: string) => {
    const key = `${path}:${statusCode}`;
    if (seen.has(key)) return;
    seen.add(key);
    files.push({ path, status: statusCode });
  };

  for (const f of status.created) push(f, "A");
  for (const f of status.deleted) push(f, "D");
  for (const f of status.renamed) push(f.to ?? f.from, "R");
  for (const f of status.modified) push(f, "M");
  for (const f of status.not_added) push(f, "A");
  // Anything else (conflicted etc.) falls back to "U"
  for (const f of status.conflicted) push(f, "U");

  return files;
}

export function hasChanges(status: StatusResult): boolean {
  return !status.isClean() || status.not_added.length > 0;
}

export async function getCurrentBranch(cwd?: string): Promise<string> {
  try {
    const status = await git(cwd).status();
    if (status.current) return status.current;
    const branches = await git(cwd).branch();
    return branches.current || "HEAD";
  } catch (err) {
    throw new GitError(`Unable to determine current branch: ${(err as Error).message}`);
  }
}

/** Returns the `origin` remote URL, or null if no remote is configured. */
export async function getRemoteUrl(cwd?: string): Promise<string | null> {
  try {
    const remotes = await git(cwd).getRemotes(true);
    const origin = remotes.find((r) => r.name === "origin") ?? remotes[0];
    return origin?.refs?.push || origin?.refs?.fetch || null;
  } catch {
    return null;
  }
}

/** Converts a git remote URL (SSH or HTTPS) into a browsable https:// repo URL. */
export function remoteUrlToHttps(remoteUrl: string): string {
  let url = remoteUrl.trim();
  url = url.replace(/\.git$/, "");
  // git@github.com:user/repo -> https://github.com/user/repo
  const sshMatch = url.match(/^git@([^:]+):(.+)$/);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`;
  }
  // ssh://git@github.com/user/repo -> https://github.com/user/repo
  url = url.replace(/^ssh:\/\/git@/, "https://");
  return url;
}

export async function stageAll(cwd?: string): Promise<void> {
  try {
    await git(cwd).add(["-A"]);
  } catch (err) {
    throw new GitError(`Failed to stage changes: ${(err as Error).message}`);
  }
}

export async function commitChanges(message: string, cwd?: string): Promise<CommitInfo> {
  try {
    const result = await git(cwd).commit(message);
    const hash = result.commit || (await git(cwd).revparse(["HEAD"])).slice(0, 7);
    const filesChanged = result.summary ? result.summary.changes : 0;
    return { hash: hash.slice(0, 7), message, filesChanged };
  } catch (err) {
    throw new GitError(`Failed to commit: ${(err as Error).message}`);
  }
}

/**
 * Pushes the current branch to `origin`, setting upstream if needed.
 * Throws a `GitError` with a `hint` for common, recoverable failures
 * (no remote, rejected push, auth errors).
 */
export async function pushBranch(branch: string, cwd?: string): Promise<void> {
  try {
    await git(cwd).push(["-u", "origin", branch]);
  } catch (err) {
    const message = (err as Error).message || "";

    if (/No configured push destination|does not appear to be a git repository|fatal: 'origin'/i.test(message)) {
      throw new GitError("No remote configured", "Run: git remote add origin https://github.com/you/repo.git");
    }
    if (/rejected|fetch first|non-fast-forward/i.test(message)) {
      throw new GitError("Push rejected (remote has changes)", `Pull first: git pull origin ${branch}`);
    }
    if (/Authentication failed|Permission denied|could not read Username/i.test(message)) {
      throw new GitError("Authentication failed", "Check your git credentials or SSH key for this remote.");
    }
    throw new GitError(`Push failed: ${message.split("\n")[0]}`);
  }
}

export async function getDiff(staged: boolean, cwd?: string): Promise<string> {
  try {
    return staged ? await git(cwd).diff(["--cached"]) : await git(cwd).diff();
  } catch {
    return "";
  }
}

/** `git reset --soft HEAD~1`. Returns the commit that was undone. */
export async function softResetLastCommit(cwd?: string): Promise<{ hash: string; message: string }> {
  try {
    const log = await git(cwd).log({ maxCount: 2 });
    const last = log.latest;
    if (!last) {
      throw new GitError("Nothing to undo", "This repository has no commits yet.");
    }
    if (log.all.length < 2) {
      throw new GitError(
        "Can't undo the initial commit",
        "This is the repository's first commit, so there's no earlier state to reset to."
      );
    }
    await git(cwd).reset(["--soft", "HEAD~1"]);
    return { hash: last.hash.slice(0, 7), message: last.message };
  } catch (err) {
    if (err instanceof GitError) throw err;
    throw new GitError(`Failed to undo last commit: ${(err as Error).message}`);
  }
}

export async function getGitUserConfig(cwd?: string): Promise<{ name?: string; email?: string }> {
  try {
    const name = (await git(cwd).getConfig("user.name")).value ?? undefined;
    const email = (await git(cwd).getConfig("user.email")).value ?? undefined;
    return { name: name || undefined, email: email || undefined };
  } catch {
    return {};
  }
}

export async function setGitUserConfig(name: string, email: string, cwd?: string): Promise<void> {
  await git(cwd).addConfig("user.name", name);
  await git(cwd).addConfig("user.email", email);
}

export async function initRepo(cwd?: string): Promise<void> {
  try {
    await git(cwd).init();
  } catch (err) {
    throw new GitError(`Failed to initialize git repository: ${(err as Error).message}`);
  }
}

export async function addRemote(url: string, cwd?: string): Promise<void> {
  await git(cwd).addRemote("origin", url);
}

/**
 * Creates and checks out a new branch (`git checkout -b <name>`). Used when
 * a user declines to push directly to a protected branch and wants to start
 * a feature branch instead.
 */
export async function createAndCheckoutBranch(branchName: string, cwd?: string): Promise<void> {
  try {
    await git(cwd).checkoutLocalBranch(branchName);
  } catch (err) {
    throw new GitError(`Failed to create branch "${branchName}": ${(err as Error).message}`);
  }
}

/** Lists local branch names. */
export async function listLocalBranches(cwd?: string): Promise<string[]> {
  try {
    const summary = await git(cwd).branchLocal();
    return Object.keys(summary.branches);
  } catch {
    return [];
  }
}

export interface RepoContext {
  fileTree: string;
  packageJson: string;
  readme: string;
}

export async function getRepoContext(cwd?: string): Promise<RepoContext> {
  let fileTree = "";
  let packageJson = "";
  let readme = "";

  try {
    const files = await git(cwd).raw(["ls-files"]);
    fileTree = files.trim();
  } catch { /* not tracked yet */ }

  try {
    const fs = await import("node:fs");
    const pkgPath = (cwd ?? process.cwd()) + "/package.json";
    if (fs.existsSync(pkgPath)) {
      const raw = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const brief: Record<string, unknown> = {};
      for (const key of ["name", "version", "description", "type", "scripts", "dependencies", "devDependencies"]) {
        if (raw[key]) brief[key] = raw[key];
      }
      packageJson = JSON.stringify(brief, null, 2);
    }
  } catch { /* no package.json */ }

  try {
    const fs = await import("node:fs");
    const readmePath = (cwd ?? process.cwd()) + "/README.md";
    if (fs.existsSync(readmePath)) {
      readme = fs.readFileSync(readmePath, "utf-8").slice(0, 2000);
    }
  } catch { /* no README.md */ }

  return { fileTree, packageJson, readme };
}
