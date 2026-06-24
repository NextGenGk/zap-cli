import {
  isGitRepo,
  initRepo,
  getGitUserConfig,
  setGitUserConfig,
  getRemoteUrl,
  addRemote,
  remoteUrlToHttps,
} from "../lib/git.js";
import { ensureOrUpdateGitignore } from "../lib/gitignore.js";
import { getConfig, setConfigValue } from "../lib/config.js";
import { verifyApiKey } from "../lib/supabase.js";
import * as out from "../ui/output.js";
import * as ui from "../ui/prompts.js";
import { pushCommand } from "./push.js";

export async function initCommand(): Promise<void> {
  const cwd = process.cwd();
  ui.intro(out.brand("⚡ zap init"));

  if (!(await isGitRepo(cwd))) {
    ui.log.message(out.info("This directory is not a git repository yet."));
    const wantsInit = await ui.confirm("Initialize a git repository here?", true);
    if (!wantsInit) {
      console.log(out.errorBlock("Not a git repository", "Run git init first, then zap init."));
      process.exitCode = 1;
      return;
    }
    await initRepo(cwd);
    ui.log.success("Git repository initialized");
  }

  // 1. Git identity
  const gitUser = await getGitUserConfig(cwd);
  if (!gitUser.name || !gitUser.email) {
    ui.log.step("Setting up your git identity");
    const name = gitUser.name ?? (await ui.text("Your name (for git commits)", undefined, "Jane Doe"));
    const email = gitUser.email ?? (await ui.text("Your email (for git commits)", undefined, "jane@example.com"));
    await setGitUserConfig(name, email, cwd);
    ui.log.success(`Git identity set: ${name} <${email}>`);
  } else {
    ui.log.success(`Git identity: ${gitUser.name} <${gitUser.email}>`);
  }

  // 2. Remote
  const existingRemote = await getRemoteUrl(cwd);
  if (existingRemote) {
    ui.log.success(`Remote: ${remoteUrlToHttps(existingRemote)}`);
  } else {
    ui.log.step("No git remote configured yet");
    const wantsRemote = await ui.confirm("Add a GitHub remote now?", true);
    if (wantsRemote) {
      const url = await ui.text("Remote URL", undefined, "https://github.com/you/repo.git");
      await addRemote(url, cwd);
      ui.log.success(`Remote added: ${remoteUrlToHttps(url)}`);
    } else {
      ui.log.message(out.muted("You can add one later with: git remote add origin <url>"));
    }
  }

  // 3. .gitignore (create or update)
  const gi = await ensureOrUpdateGitignore(cwd);
  if (gi.created) {
    ui.log.success(`Generated .gitignore (${gi.types.join(", ") || "generic"})`);
  } else if (gi.addedLines.length > 0) {
    ui.log.success(`Updated .gitignore (+${gi.addedLines.length} new patterns)`);
  } else {
    ui.log.message(out.muted(".gitignore is up to date"));
  }

  // 4. Dashboard connection (unlocks AI commit messages + push history)
  const config = getConfig();
  let dashboardConnected = !!config.zapApiKey;

  if (dashboardConnected) {
    const currentUrl = config.zapSupabaseUrl || "unknown";
    ui.log.success(`Dashboard connected: ${currentUrl}`);
    const reconnect = await ui.confirm("Connect to a different dashboard?", false);
    if (reconnect) dashboardConnected = false;
  }

  if (!dashboardConnected) {
    ui.log.message(out.info("Connect to the zap dashboard to enable AI commit messages and push history."));
    const wantsDashboard = await ui.confirm("Connect to the zap dashboard now?", true);
    if (wantsDashboard) {
      const url = await ui.text(
        "Dashboard URL",
        config.zapSupabaseUrl || "https://zap-cli-web.vercel.app",
        "https://zap-cli-web.vercel.app"
      );
      const apiKey = await ui.text("Paste your API key (from Settings → API Keys)");
      setConfigValue("zapSupabaseUrl", url);
      setConfigValue("zapApiKey", apiKey);

      const spin = ui.spinner();
      spin.start("Verifying API key...");
      const ver = await verifyApiKey(apiKey, url);
      if (ver.ok) {
        spin.stop("Dashboard connected ✓");
        dashboardConnected = true;
        ui.log.success("AI commit messages are ready — use `zap --ai` on your next push.");
      } else {
        spin.stop("Could not connect");
        const hint = ver.error ?? "Unknown error — check the dashboard URL and API key";
        ui.log.warn(out.muted(hint));
        const force = await ui.confirm("Save connection anyway? (sync will start once fixed)", false);
        if (force) {
          dashboardConnected = true;
          ui.log.message(out.muted("Saved — run `zap init` again to retry the connection."));
        } else {
          setConfigValue("zapSupabaseUrl", "");
          setConfigValue("zapApiKey", "");
          ui.log.message(out.muted("Connection cancelled. Run `zap init` again to retry."));
        }
      }
    } else {
      ui.log.message(out.muted("Skipped — run `zap init` again anytime to connect."));
    }
  }

  // 5. AI default preference (only ask if dashboard is connected)
  if (dashboardConnected && !config.aiDefault) {
    const setDefault = await ui.confirm("Use AI commit messages by default on every `zap` push?", false);
    if (setDefault) {
      setConfigValue("aiDefault", true);
      ui.log.success("AI commit messages enabled by default.");
    }
  }

  setConfigValue("initialized", true);

  // 6. Summary
  const finalConfig = getConfig();
  const remoteAfter = await getRemoteUrl(cwd);
  ui.note(
    [
      `Git identity:     ${out.muted("configured")}`,
      `Remote:           ${remoteAfter ? out.muted(remoteUrlToHttps(remoteAfter)) : out.muted("not set")}`,
      `.gitignore:       ${out.muted("ready")}`,
      `Dashboard:        ${dashboardConnected ? out.brand("connected") : out.muted("not connected")}`,
      `AI commits:       ${dashboardConnected ? (finalConfig.aiDefault ? out.brand("on by default") : out.muted("available via zap --ai")) : out.muted("connect dashboard to enable")}`,
    ].join("\n"),
    "Setup summary"
  );

  // 7. Optional push
  const wantsTestPush = await ui.confirm("Push your changes now?", false);
  if (wantsTestPush) {
    await pushCommand({});
  } else {
    ui.outro(`You're all set. Run ${out.brand("zap")} to push your next change.`);
  }
}
