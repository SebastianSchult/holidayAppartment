# Secret Handling & Rotation

## Scope
This project uses secrets in two places:

- `backend-php/config.php` (server runtime only, never commit)
- local `.env*` files (developer machine / CI only)

## Rules

1. Never commit credentials, passwords, API keys, tokens, private certs.
2. Keep private values only in:
   - local untracked config files
   - GitHub Actions secrets
   - hosting provider secret storage
3. Commit only templates (`*.example`) with placeholders.

## Setup

1. Copy `backend-php/config.example.php` to `backend-php/config.php`.
2. Insert real values in `backend-php/config.php`.
3. Keep `backend-php/config.php` untracked (already in `.gitignore`).

## Rotation Checklist (for leaked secrets)

1. Revoke/rotate all exposed credentials at provider side:
   - mail API key
   - SMTP password
   - any copied tokens/passwords
2. Update production/server config with new values.
3. Update local developer configs.
4. Verify mail sending with new credentials.

## Git History Cleanup

If a secret was committed in the past, remove it from Git history and force push.

### Option A: git-filter-repo

```bash
# install once (macOS): brew install git-filter-repo
git filter-repo --path backend-php/config.php --invert-paths
git push --force --all origin
git push --force --tags origin
```

### Option B: BFG Repo-Cleaner

Use BFG only if your team already uses it. Follow BFG docs for secret replacement/deletion and force push after rewrite.

## After History Rewrite

1. Inform all collaborators.
2. Everyone must re-clone or hard-reset to the rewritten history.
3. Re-check that no secrets appear in:
   - working tree
   - full git log/history
   - GitHub code search
