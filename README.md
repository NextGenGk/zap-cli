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

| Command | What it does |
|---|---|
| `zap` | Stage all → commit → push current branch |
| `zap --ai` | Same, with AI-generated commit message |
| `zap --dry-run` | Simulation — no git changes, no push |
| `zap --undo` | `git reset --soft HEAD~1` — undo last commit, keep changes staged |
| `zap --check` | Run lint/test/build checks before pushing |
| `zap --skip-check` | Skip pre-push checks for this push |
| `zap log` | Show recent push history (dashboard if connected, local otherwise) |
| `zap init` | First-time setup (git identity, remote, .gitignore, dashboard) |
| `zap config --show` | View all local settings |
| `zap config --check always\|never\|ask` | Set pre-push check behavior |
| `zap config --ai on\|off` | Toggle AI commit messages by default |
| `zap config --warn-main on\|off` | Toggle main/master branch warning |

### AI commit messages

`zap --ai` reads your diff and generates a Conventional Commit message. The commit is never pushed until you approve it.

Provider order (first available wins):
1. **Dashboard proxy** — if connected via `zap init`, uses the dashboard's AI key
2. **`GROQ_API_KEY` env var** — direct Groq API access (self-hosted)
3. **Heuristic** — smart guess from changed file names (always works offline)

### Main branch protection

Pushing to `main`/`master` triggers a warning. You can push directly, or zap creates a new branch and switches to it.

### Pre-push checks

If your project has `lint`, `test`, or `build` scripts, zap can run them before pushing:
- `zap --check` — run once
- `zap config --check always` — always run
- `zap config --check ask` — ask each time (default)
- `zap config --check never` — skip

### .gitignore auto-generation

zap detects your project type and creates a `.gitignore` from bundled templates. Supports: **Node, Next.js, React, Python, Django, Laravel, Go, Rust, Java**. Won't overwrite an existing `.gitignore`.

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
