# zap ⚡

**Push code. Just type `zap`.**

Replace `git add`, `git commit`, and `git push` with one command — with AI commit messages, auto git init, main-branch guardrails, and instant undo.

---

## Quick start (CLI only — no dashboard needed)

```bash
npm install -g zap-git
cd your-project
zap
```

That's it. `zap` stages all changes, prompts for a commit message, and pushes. No config files, no signup, no dashboard required.

For AI-generated commit messages (heuristic fallback — works offline):

```bash
zap --ai       # suggests a message from changed file names
```

To connect to the zap dashboard for **real AI commit messages** and **push history**, see below.

---

## Full experience (CLI + Dashboard)

### For end users

```bash
npm install -g zap-git
cd your-project
zap init
# Dashboard URL: <your dashboard URL>
# API key:      <paste from Settings>
```

Now every `zap --ai` sends your diff to the dashboard's AI endpoint — you get accurate Conventional Commits without your own API key. Push history syncs to your dashboard automatically.

### For dashboard operators

1. Deploy the web app to Vercel (see [Deployment](#deployment))
2. Set these env vars in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=    # from Supabase Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=                # powers zap --ai for all users
NEXT_PUBLIC_APP_URL=         # your Vercel URL
```

3. Run `supabase/schema.sql` in your Supabase SQL editor
4. Sign up, go to **Settings → API Keys → New key**, hand the key to your users

---

## Commands

### `zap`

Stage all changes, commit, and push the current branch. If the project hasn't been initialized, runs the setup wizard first.

```
zap [options]
```

| Flag | Description |
|---|---|
| `--ai` | Generate the commit message with AI |
| `--dry-run` | Simulate the full flow without making any changes |
| `--check` | Run pre-push checks (lint / test / build) before pushing |
| `--skip-check` | Skip pre-push checks for this push |
| `--undo` | Undo the last commit (git reset --soft HEAD~1), keep changes staged |

**Examples:**

```bash
zap                          # push with a manual message
zap --ai                     # push with an AI-generated message
zap --dry-run                # see what would happen
zap --check                  # push after checks pass
zap --skip-check             # push without checks
zap --undo                   # undo the last push
```

---

### `zap init`

Interactive first-time setup wizard. Creates a git repo if needed, sets your git identity, generates a `.gitignore` from your project stack, and optionally connects to the zap dashboard for AI commit messages and push history.

```
zap init
```

**Example:**

```bash
$ zap init
  ◇  Setting up your project...
  ✓  Initialized empty Git repo
  ✓  Identity set — Alex
  ✓  .gitignore generated (12 entries)
  ✓  Dashboard linked
  →  Ready in 1.2s
```

Re-run `zap init` anytime to reconnect a different dashboard. Runs automatically on first `zap` if uninitialized.

---

### `zap log`

View recent push history across your repos. Shows time, branch, commit message, and hash. Fetches from the dashboard if connected, otherwise reads from local cache.

```
zap log [options]
```

| Flag | Description |
|---|---|
| `-n, --limit <number>` | Number of entries to show (default: 20) |

**Example:**

```bash
$ zap log -n 5
  TIME        BRANCH       MESSAGE                          HASH
  2m ago      feat/login   feat(auth): add OTP verificati…  a3f91c2
  1h ago      main         fix: header alignment on mobile   b8e2d1f
  3h ago      feat/login   chore: update deps               e7c3a9b
```

---

### `zap config`

View or update your local CLI configuration.

```
zap config [options]
```

| Flag | Description |
|---|---|
| `--show` | Show all current configuration |
| `--check <mode>` | Set pre-push check behavior: `always`, `never`, or `ask` |
| `--ai <state>` | Toggle AI commit messages by default: `on` or `off` |
| `--warn-main <state>` | Toggle main/master branch warning: `on` or `off` |
| `--reset` | Reset all configuration to defaults |

**Examples:**

```bash
zap config --show                    # view current settings
zap config --check always            # run checks before every push
zap config --ai on                   # use AI by default
zap config --warn-main off           # disable main branch warning
zap config --reset                   # factory reset
```

---

### `zap --undo`

Soft-resets the last commit (`git reset --soft HEAD~1`) while keeping your changes staged. Safe and instant.

```
zap --undo
```

**Example:**

```bash
$ zap --undo
  ◇  Resetting HEAD~1
  ✓  Commit undone — changes are still staged
  →  Run `zap` to recommit
```

---

### AI commit messages

`zap --ai` reads your diff and repo context (file tree, README, package.json) to generate a Conventional Commit message. The commit is never pushed until you approve, edit, or regenerate it.

Provider order (first available wins):
1. **Dashboard proxy** — if connected via `zap init`, uses the dashboard's AI key
2. **`GROQ_API_KEY` env var** — direct Groq API access (self-hosted)
3. **Heuristic** — smart guess from changed file names (always works offline — never blocks a push)

**Example:**

```bash
$ zap --ai
  ◌  Scanning repo context...
  ◌  Generating commit message with AI...

  ○  AI suggestion:
  │  feat(auth): add OTP verification step to login flow
  │
  ?  Accept · Edit · Regenerate
```

---

### Main branch protection

Pushing to `main`/`master` prompts a warning. You can confirm the push, or zap creates a new branch and switches to it automatically.

```
zap config --warn-main off   # disable
```

---

### Pre-push checks

If your project has `lint`, `test`, or `build` scripts in `package.json`, zap can run them before every push.

```
zap config --check always    # always run checks
zap config --check ask       # ask each time (default)
zap config --check never     # skip checks
zap --check                  # run checks once
zap --skip-check             # skip checks once
```

---

### .gitignore auto-generation

zap detects your project type and generates a `.gitignore` from bundled templates. Supports: **Node, Next.js, React, Python, Django, Laravel, Go, Rust, Java**. Won't overwrite an existing `.gitignore`.

```
zap init  (generated automatically)
```

---

## Dashboard features

| Page | What's there |
|---|---|
| **Overview** | Push stats, 14-day activity chart, streak tracking |
| **Push history** | All pushes filterable by branch |
| **AI usage** | Token usage chart, AI-assisted push count |
| **Settings** | CLI preferences (synced to all devices), API key management |

---

## Deployment

```bash
git clone <repo>
cd apps/web
npm install
npm run dev          # http://localhost:3000
```

For production, deploy to Vercel:
1. Push to GitHub
2. Import in Vercel (root directory: `apps/web`)
3. Set the 5 env vars listed above
4. Deploy

---

## Development

```bash
# CLI
cd packages/cli && npm install && npm run build && npm link
npm test

# Web
cd apps/web && npm install && npm run dev
```

## Architecture

```
User runs: zap --ai
    │
    ├── Reads git diff
    ├── POSTs diff to dashboard: POST /api/ai/commit-message
    │       Bearer: <api_key>
    │   Dashboard:
    │       1. Hashes key, looks up in api_keys
    │       2. Calls AI with platform key
    │       3. Returns { message, tokens_used, model }
    │       4. Logs ai_usage for the dashboard's AI page
    │
    ├── Shows message to user (accept / edit / regenerate)
    ├── git add -A && git commit -m "<message>" && git push -u origin <branch>
    │
    └── POSTs to dashboard: POST /api/push-events
        → Stored in push_events, shown in History + Overview
```

zap falls back to a heuristic message from file names when no dashboard or AI key is available — it never blocks a push.
