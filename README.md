# zap ⚡

**Push code. Just type `zap`.**

Replace `git add + git commit + git push` with a single command. Track everything on your dashboard.

```
npm install -g zap-git
cd your-project
zap init        # one-time setup
zap             # stage → smart commit → push
```

---

## How it works

zap is two products that work together:

| Product | What it does |
|---|---|
| **Dashboard** (hosted) | Sign up, get your API key, track push history, AI usage, and team settings |
| **CLI** (`zap-git` on npm) | One-command push with AI commit messages, pre-push checks, branch protection |

Users start at the dashboard, then connect the CLI — so every push flows through your SaaS.

---

## Quick start

### 1. Create a dashboard account

Go to **[zap-cli-web.vercel.app](https://zap-cli-web.vercel.app)** → **Get started** → create an account.

Once signed in, navigate to **Settings → API Keys** and generate a new key.

### 2. Install the CLI

```bash
npm install -g zap-git
```

### 3. Connect to your repo

```bash
cd your-project
zap init
```

When prompted:
- **Dashboard URL** — `https://zap-cli-web.vercel.app` (or your own deployment)
- **API key** — paste the key from step 1

### 4. Push

```bash
zap                 # stage all → smart commit message → push
zap --ai            # AI-generated commit message from your diff
zap --dry-run       # preview everything, nothing committed/pushed
zap --undo          # soft-reset last commit, keep changes staged
zap log             # view recent push history
```

---

## CLI reference

| Command | What it does |
|---|---|
| `zap` | Stage all → suggest commit message → push current branch |
| `zap --ai` | Same, but commit message is AI-generated from your diff |
| `zap --dry-run` | Full simulation — no git changes, no push, no sync |
| `zap --undo` | `git reset --soft HEAD~1` — removes last commit, keeps changes staged |
| `zap --check` | Run `lint`/`test`/`build` scripts before pushing |
| `zap --skip-check` | Skip pre-push checks for this run |
| `zap log` | Show recent push history (from dashboard if connected, local otherwise) |
| `zap init` | First-time setup wizard (git identity, remote, .gitignore, dashboard) |
| `zap config --show` | View all local settings |
| `zap config --check always\|never\|ask` | Set pre-push check behavior |
| `zap config --ai on\|off` | Toggle AI commit messages by default |
| `zap config --warn-main on\|off` | Toggle main/master branch warning |

### Main branch protection

When you try to push to `main` or `master`, zap warns and offers to:
1. Push directly anyway (with explicit confirmation)
2. Create and switch to a new branch instead

### AI commit messages

`zap --ai` reads your staged diff and sends it to the dashboard's AI endpoint. The dashboard uses its own **Groq** key — users never need their own AI provider.

Fallback chain:
1. Dashboard proxy (primary)
2. `GROQ_API_KEY` env var (self-hosted override)
3. Heuristic message from file names (always works offline)

### .gitignore auto-generation

On first push, zap detects your project type and creates a `.gitignore`. Supported: **Node, Next.js, React, Python, Django, Laravel, Go, Rust, Java**. Will not overwrite an existing `.gitignore`.

### Pre-push checks

If `package.json` has `lint`, `test`, or `build` scripts, zap can run them before pushing:

```
zap config --check always    # always check
zap config --check ask       # ask each time (default)
zap config --check never     # skip checks
```

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

## Self-hosting

### Prerequisites

- Node.js >= 20
- A Supabase project (free tier works)

### Environment variables

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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `GROQ_API_KEY` | [GroqCloud](https://console.groq.com) — powers AI for all users |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (defaults to `http://localhost:3000` in dev) |

**CLI env vars** (override stored config)

```env
ZAP_API_KEY=
ZAP_SUPABASE_URL=
GROQ_API_KEY=
```

### Setup

```bash
git clone https://github.com/NextGenGk/zap-cli.git
cd zap-cli

# Dashboard
cp apps/web/.env.example apps/web/.env.local
# fill in your env vars, then:
cd apps/web && npm install && npm run dev

# Database
# Run supabase/schema.sql in your Supabase SQL editor

# CLI
cd packages/cli && npm install && npm run build && npm link
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
    │       2. Calls Groq with platform key
    │       3. Returns { message, tokens_used, model }
    │       4. Records ai_usage row
    │
    ├── Shows message (accept / edit / regenerate)
    ├── git add -A && git commit -m "<msg>" && git push
    │
    └── POSTs push event to dashboard: POST /api/push-events
        → Stored in push_events, shown in History + Overview
```

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

## Development

```bash
# CLI
cd packages/cli && npm install && npm run build && npm link
npm test

# Web
cd apps/web && npm install && npm run dev
npm run build && npm run lint

# CLI release workflow
git add .
git commit -m "fix: ..."
npm run cli:release    # bumps version, builds, tags, pushes, publishes
```
