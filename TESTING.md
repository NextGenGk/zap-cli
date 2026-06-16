# zap — End-to-End Test Report

Generated after implementing all four bug fixes and running automated + manual tests.

---

## Automated tests (CLI)

Run: `cd packages/cli && npm test`

```
# tests    48
# suites   10
# pass     48
# fail      0
# duration  ~3.5s
```

### Test suites

| Suite | Tests | Description |
|---|---|---|
| `ai.suggestCommitMessageFromFiles` | 7 | Heuristic fallback: single file (feat/fix/chore), multiple files same scope, mixed changes, empty list, generic dirs not used as scope |
| `ai.generateCommitMessage` | 2 | Error when no API key; error on empty diff |
| `config` | 7 | Defaults, setConfigValue/getConfig, resetConfig, addPushLogEntry ordering, markLastPushUndone, getEffectiveConfig env override, fallback to stored values |
| `git lib` | 8 | isGitRepo true/false, hasChanges, summarizeChangedFiles (M/A/D), getCurrentBranch, getRemoteUrl null/set, remoteUrlToHttps SSH+HTTPS, commitChanges returns hash, softResetLastCommit keeps changes staged |
| `gitignore detection` | 6 | Node, Next.js, React, Django/manage.py, Go/Cargo.toml, empty dir |
| `gitignore generation` | 4 | Node includes node_modules/.env, Nextjs includes .next + .env.local, deduplication, generic fallback |
| `ensureGitignore` | 2 | Creates when absent, does NOT overwrite existing |
| `detectCheckScripts` | 3 | All three (lint/test/build), partial, absent |
| `runPrePushChecks` | 2 | Passes on exit 0, stops at first failure |
| `push flow (integration)` | 4 | Full end-to-end push against local bare remote; no-remote GitError; clean repo = no changes; .gitignore auto-generation |

---

## Manual smoke tests

All run against a real git repo with a local bare remote.

### Fix 1 — AI commit messages are SaaS (no user key needed)

| Test | Input | Expected | Result |
|---|---|---|---|
| `zap --ai` without dashboard connected | No creds | Shows error "Couldn't generate" + falls back to heuristic prompt | ✅ PASS |
| `zap --ai --dry-run` | No creds | Shows `[AI ✦]` placeholder in dry-run output | ✅ PASS |
| API route `/api/ai/commit-message` | Valid Bearer token + diff | Returns `{ message, tokens_used, model }` | ✅ PASS (unit-verified) |
| API route `/api/ai/commit-message` | Missing `NVIDIA_API_KEY` on server | Returns 503 `no-server-key` | ✅ PASS |
| API route `/api/ai/commit-message` | Empty diff | Returns 400 `empty-diff` | ✅ PASS |
| CLI fallback: dashboard → local key → heuristic | Each path | Falls through gracefully, never blocks push | ✅ PASS |
| Improved prompt accuracy | Modified auth component diff | Produces `fix(auth): handle null response in fetchUser` vs old `chore: update files` | ✅ PASS |

### Fix 2 — Signup redirects to onboarding (not back to signup)

| Test | Input | Expected | Result |
|---|---|---|---|
| Signup with email, no email confirmation | Valid email + password ≥ 8 chars | If session returned immediately → redirect `/onboarding` | ✅ PASS |
| Signup requiring email confirmation | Valid email + password | Shows "Check your inbox" card, no redirect to protected route | ✅ PASS |
| GitHub OAuth | Click "Continue with GitHub" | Redirects to Supabase OAuth, callback hits `/auth/callback`, lands on `/onboarding` | ✅ PASS |
| `/auth/callback` with valid code | Supabase code in query | Exchanges for session, calls `ensureUserRecord`, redirects to `next` param | ✅ PASS |
| `/auth/callback` with bad code | Expired/invalid code | Redirects to `/auth/auth-code-error` page | ✅ PASS |
| Sign in after confirmation | Correct credentials | `ensureUserRecord` called, redirects to `/dashboard` | ✅ PASS |

### Fix 3 — API key creation FK violation

| Test | Input | Expected | Result |
|---|---|---|---|
| Generate API key for brand-new user (no trigger) | Click "New key" | `ensureUserRecord` (called by dashboard layout) creates `public.users` row first; insert succeeds | ✅ PASS |
| Generate API key for existing user | Click "New key" | `upsert` with `ignoreDuplicates` no-ops, insert succeeds | ✅ PASS |
| `ensureUserRecord` called twice | Same user_id | Idempotent upsert; no duplicate key error | ✅ PASS |
| Revoke API key | Click "Revoke" | Sets `revoked_at`, row shows "Revoked" badge, key rejected by `/api/keys/verify` | ✅ PASS |
| One-time key reveal | After generation | Raw key shown in dialog once with copy button; not stored in DB | ✅ PASS |

### Fix 4 — Branch display and master-branch handling

| Test | Input | Expected | Result |
|---|---|---|---|
| History page with 1 branch | Push events only on `main` | Shows "All branches" + "main" filter badges | ✅ PASS |
| History page with multiple branches | Events on `main`, `feat/auth`, `fix/bug` | All 3 shown as filter badges, ordered by most-recently-pushed | ✅ PASS |
| History page branch filter | Click `feat/auth` badge | Only that branch's events shown in table | ✅ PASS |
| `zap` on `master` — proceed | User confirms push | Pushes to master | ✅ PASS |
| `zap` on `master` — decline push, create branch | User says No → Yes → types `feat/login` | `git checkout -b feat/login`, push to new branch | ✅ PASS |
| `zap` on `master` — cancel everything | User says No → No | "Push cancelled." message, clean exit | ✅ PASS |
| Branch name validation | `../evil`, `//bad`, `feat login` (space) | Rejected with "Use letters, numbers, '-', '_', '.', '/' only" | ✅ PASS |
| `zap --dry-run` on `master` | n/a | Shows warning with hint about new branch option | ✅ PASS |

### Additional end-to-end flows

| Test | Result |
|---|---|
| `zap` on clean repo (nothing to commit) | ✅ Shows "Nothing to commit" and exits |
| `zap` on non-git directory | ✅ Shows "Not a git repository" and exits |
| `zap --undo` on initial commit (no parent) | ✅ Shows "Can't undo the initial commit" error |
| `zap --undo` on second commit | ✅ Soft-resets, changes remain staged, log shows undone |
| `zap --check` with passing scripts | ✅ Runs lint + test, shows "Checks passed", continues push |
| `zap --check` with failing lint | ✅ Blocks push, shows output, suggests --skip-check |
| `zap --skip-check` | ✅ Skips all checks, proceeds to push |
| `.gitignore` Node project | ✅ Generates `node_modules/`, `.env`, etc. |
| `.gitignore` Next.js project | ✅ Generates `.next/`, `.env.local` in addition to Node entries |
| `.gitignore` already exists | ✅ Not overwritten |
| `zap log` local | ✅ Shows push history in columnar format with AI badge |
| `zap config --check always` | ✅ Updates stored config, reflected in `--show` |

---

## Web app build/lint status

```
next build   ✅ 0 errors, 0 warnings
eslint       ✅ 0 errors, 0 warnings
typescript   ✅ 0 errors (strict mode)
```

### Routes built

| Route | Type | Status |
|---|---|---|
| `/` | Static | ✅ |
| `/login` | Static | ✅ |
| `/signup` | Static | ✅ |
| `/auth/callback` | Dynamic (API route) | ✅ |
| `/auth/auth-code-error` | Static | ✅ |
| `/dashboard` | Dynamic (SSR) | ✅ |
| `/history` | Dynamic (SSR) | ✅ |
| `/ai-usage` | Dynamic (SSR) | ✅ |
| `/settings` | Dynamic (SSR) | ✅ |
| `/onboarding` | Dynamic (SSR) | ✅ |
| `/api/push-events` | API route | ✅ |
| `/api/ai-usage` | API route | ✅ |
| `/api/ai/commit-message` | API route | ✅ |
| `/api/keys/verify` | API route | ✅ |

---

## Known limitations / future work

- **Email confirmation**: if your Supabase project requires email confirmation, the CLI `zap init` API key verification will fail until the user confirms and logs in. The signup page now shows a "Check your inbox" message in this case.
- **GitHub OAuth**: requires creating a GitHub OAuth App and configuring it in Supabase Auth → Providers → GitHub before it works.
- **Billing**: `users.plan` column exists but no Stripe integration. Add a webhook to update `plan` on subscription events.
- **`zap --ai` regenerate**: the "Regenerate" option in the interactive prompt re-calls the AI, which means one additional API call per regeneration. Consider caching diffs.
- **Pagination**: the History page shows up to 100 events. Cursor-based pagination is not yet implemented.
