# zap ⚡

**Push code. Just type `zap`.**

Replace `git add + git commit + git push` with a single command — with AI commit messages, branch protection, pre-push checks, and instant undo.

```
npm install -g zap-git
cd your-project
zap          # stage, commit, push — done
```

For AI commit messages, push history, and team analytics, connect to the [zap dashboard](https://zap-cli-web.vercel.app).

---

## Quick start

### CLI only (no dashboard needed)

```bash
npm install -g zap-git
cd your-project
zap
```

`zap` stages all changes, prompts for a commit message, and pushes. No config, no signup.

For heuristic commit messages (works offline):

```bash
zap --ai
```

### Full experience (CLI + Dashboard)

#### For end users

1. Sign up at **[zap-cli-web.vercel.app](https://zap-cli-web.vercel.app)**
2. Go to **Settings → API Keys** → generate a key
3. Connect the CLI:

```bash
npm install -g zap-git
cd your-project
zap init
# Dashboard URL: https://zap-cli-web.vercel.app
# API key:      <paste from Settings>
```

Now `zap --ai` uses the dashboard's AI key — no API key needed on your end. Push history syncs automatically.

#### For dashboard operators (self-host)

1. Deploy the web app (see [Deployment](#deployment))
2. Set env vars in your deployment
3. Run `supabase/schema.sql` in Supabase SQL editor
4. Sign up, go to **Settings → API Keys**, hand keys to your users

---

## Commands

### `zap`

Stage all changes → suggest commit message → push current branch.

```bash
zap [options]
```

| Flag | Description |
|---|---|
| `--ai` | AI-generated commit message from your diff |
| `--dry-run` | Simulate the full flow — no changes made |
| `--check` | Run lint/test/build before pushing |
| `--skip-check` | Skip pre-push checks for this run |
| `--undo` | `git reset --soft HEAD~1` — undo last commit, keep changes staged |

**Examples:**

```bash
zap                          # push with a manual message
zap --ai                     # push with an AI-generated message
zap --dry-run                # see what would happen
zap --check                  # push after checks pass
zap --skip-check             # push without checks
zap --undo                   # undo the last push
```

### `zap init`

Interactive first-time setup: creates a git repo if needed, sets identity, generates `.gitignore`, and optionally links your dashboard.

```bash
zap init
```

Re-run anytime to reconnect a different dashboard. Runs automatically on first `zap` if uninitialized.

### `zap log`

View recent push history. Fetches from dashboard if connected, otherwise reads local cache.

```bash
zap log [-n <number>]
```

| Flag | Description |
|---|---|
| `-n, --limit <number>` | Number of entries to show (default: 20) |

```bash
$ zap log -n 5
  TIME        BRANCH       MESSAGE                          HASH
  2m ago      feat/login   feat(auth): add OTP verificati…  a3f91c2
  1h ago      main         fix: header alignment on mobile   b8e2d1f
  3h ago      feat/login   chore: update deps               e7c3a9b
```

### `zap config`

View or update local CLI configuration.

```bash
zap config [options]
```

| Flag | Description |
|---|---|
| `--show` | Show all current configuration |
| `--check <mode>` | Pre-push check behavior: `always`, `never`, or `ask` |
| `--ai <state>` | Toggle AI commit messages: `on` or `off` |
| `--warn-main <state>` | Toggle main/master branch warning: `on` or `off` |
| `--reset` | Reset all configuration to defaults |

```bash
zap config --show                    # view current settings
zap config --check always            # run checks before every push
zap config --ai on                   # use AI by default
zap config --warn-main off           # disable main branch warning
zap config --reset                   # factory reset
```

### `zap --undo`

Soft-resets the last commit (`git reset --soft HEAD~1`) while keeping changes staged.

```bash
$ zap --undo
  ◇  Resetting HEAD~1
  ✓  Commit undone — changes are still staged
  →  Run `zap` to recommit
```

### AI commit messages

`zap --ai` reads your diff and repo context to generate a Conventional Commit. The commit is never pushed until you approve, edit, or regenerate.

Provider order (first available wins):
1. **Dashboard proxy** — uses the dashboard's AI key (if connected)
2. **`GROQ_API_KEY` env var** — direct Groq API access
3. **Heuristic** — smart guess from changed file names (always works offline)

```bash
$ zap --ai
  ◌  Scanning repo context...
  ◌  Generating commit message with AI...

  ○  AI suggestion:
  │  feat(auth): add OTP verification step to login flow
  │
  ?  Accept · Edit · Regenerate
```

### Main branch protection

Pushing to `main`/`master` prompts a warning. Confirm to push directly, or zap creates a new branch automatically.

```
zap config --warn-main off   # disable warning
```

### Pre-push checks

If your project has `lint`/`test`/`build` scripts, zap can run them before pushing.

```
zap config --check always    # always run checks
zap config --check ask       # ask each time (default)
zap config --check never     # skip checks
zap --check                  # run checks once
zap --skip-check             # skip checks once
```

### .gitignore auto-generation

Detects your project type and generates a `.gitignore` from bundled templates. Supports: **Node, Next.js, React, Python, Django, Laravel, Go, Rust, Java**. Won't overwrite an existing `.gitignore`.

---

## Dashboard features

| Page | What's there |
|---|---|
| **Overview** | Stats (total pushes, this week, AI %, streak), 14-day activity chart, recent pushes |
| **Push history** | All pushes filterable by branch |
| **AI usage** | Token usage chart, AI-assisted push count, estimated time saved |
| **Settings** | CLI preferences (synced to all devices), API key management |
| **Onboarding** | Step-by-step connect guide after signup |

Press `⌘K` (or `Ctrl+K`) anywhere in the dashboard to open the command palette.

---

## Environment variables

**`apps/web/.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_APP_URL=
```

| Key | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `GROQ_API_KEY` | [GroqCloud](https://console.groq.com) |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL |

**CLI env vars** (override stored config)

```env
ZAP_API_KEY=
ZAP_SUPABASE_URL=
GROQ_API_KEY=
```

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
3. Set the 5 env vars
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

---

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
    ├── Shows message (accept / edit / regenerate)
    ├── git add -A && git commit -m "<msg>" && git push
    │
    └── POSTs to dashboard: POST /api/push-events
        → Stored in push_events, shown in History + Overview
```

zap falls back to a heuristic message from file names when no dashboard or AI key is available — it never blocks a push.

---

## Supabase schema

Run `supabase/schema.sql` in your SQL editor. It creates:

- `public.users` — mirrors `auth.users` with a `plan` column
- `public.user_settings` — per-user CLI preferences
- `public.push_events` — CLI push event log
- `public.ai_usage` — token usage per AI call
- `public.api_keys` — SHA-256 hashed keys only
- RLS policies for per-user isolation
- Trigger `on_auth_user_created` for auto-provisioning on signup

---

## CLI release workflow

```bash
git add .
git commit -m "fix: ..."
npm run cli:release    # bumps version, builds, tags, pushes, publishes
```
