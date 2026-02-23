# Antjes Ankerplatz

Booking and admin web app for a holiday apartment.

This repository contains:
- A Vite + React + TypeScript frontend
- Firebase (Firestore/Auth) integration
- Optional Firebase Cloud Functions mail flow
- A PHP mail endpoint for production hosting on all-inkl (`/api/send-booking-mail.php`)

## Tech Stack

- Frontend: React 19, TypeScript, Vite 7, Tailwind CSS
- Data/Auth: Firebase Firestore + Firebase Auth
- Backend options for mail:
  - Firebase Functions (`functions/`)
  - PHP endpoint (`backend-php/send-booking-mail.php`)
- CI/CD: GitHub Actions

## Repository Structure

- `src/` frontend app
- `functions/` Firebase Functions (TypeScript)
- `backend-php/` PHP mail endpoint + Composer dependencies
- `.github/workflows/ci.yml` CI checks
- `.github/workflows/deploy-allinkl-ftps.yml` production frontend deploy (FTPS)
- `firestore.rules` Firestore security rules
- `firestore.indexes.json` Firestore indexes (source of truth)

## Prerequisites

- Node.js 22 (recommended; CI runs on Node 22)
- npm
- Firebase CLI (for rules/index/functions/emulators)
- PHP + Composer (only if you work on `backend-php/`)

## Local Setup

### 1. Install dependencies

```bash
npm ci
npm --prefix functions ci
```

### 2. Configure frontend env

Create `.env.local` in repo root:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_DEFAULT_PROPERTY_ID=...

# optional
VITE_MAIL_API_URL=http://localhost:8081/send-booking-mail.php
VITE_ASSET_BASE_URL=
VITE_FIRESTORE_DEBUG=0
VITE_USE_EMULATORS=0
VITE_AUTH_EMULATOR=0
```

Notes:
- `VITE_DEFAULT_PROPERTY_ID` is required for booking/admin data loading.
- If `VITE_MAIL_API_URL` is not set, frontend falls back to `/api/send-booking-mail.php`.

### 3. Run frontend

```bash
npm run dev
```

### 4. Optional: run Firebase emulators

```bash
firebase emulators:start
```

(Ports configured in `firebase.json`.)

### 5. Optional: run functions locally

```bash
npm --prefix functions run serve
```

## Scripts

### Root

- `npm run dev` start frontend dev server
- `npm run preview` preview production build
- `npm run lint:frontend` lint frontend
- `npm run typecheck:frontend` TypeScript project references check (`tsc -b`)
- `npm run build:frontend` build frontend
- `npm run lint:functions` lint functions
- `npm run build:functions` build functions
- `npm run lint` alias for `lint:frontend`
- `npm run build` alias for `build:frontend`
- `npm run ci` run frontend + functions checks end-to-end

### Functions (`functions/package.json`)

- `npm --prefix functions run lint`
- `npm --prefix functions run build`
- `npm --prefix functions run serve`

## E2E Testing (Playwright Baseline)

Install browser once:

```bash
npm run e2e:install
```

Run E2E tests:

```bash
npm run e2e
```

Run against an external/staging URL:

```bash
PLAYWRIGHT_BASE_URL=https://your-preview-url npm run e2e
```

Useful variants:

- `npm run e2e:headed`
- `npm run e2e:ui`
- `npm run e2e:report`

Current baseline includes public smoke tests and documented placeholders for booking/admin flows.
See `tests/e2e/README.md` for scope, naming conventions, and environment strategy.

## Environment Variables and Secrets

### Frontend env (`VITE_*`)

Required:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_DEFAULT_PROPERTY_ID`

Optional:
- `VITE_MAIL_API_URL`
- `VITE_ASSET_BASE_URL`
- `VITE_FIRESTORE_DEBUG`
- `VITE_USE_EMULATORS`
- `VITE_AUTH_EMULATOR`

Important:
- Do **not** use `VITE_MAIL_API_KEY`. The frontend no longer sends a mail API key.

### Functions env (`process.env`)

Used by `functions/src/mailer.ts` and `functions/src/index.ts`:
- `OWNER_EMAIL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `SMTP_SECURE`
- `FROM_EMAIL`
- `SMTP_AUTH_METHOD`
- `SMTP_REQUIRE_TLS`

### PHP mail endpoint config (`backend-php/config.php`)

Expected constants include:
- `FIREBASE_API_KEY`
- `ADMIN_EMAILS`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `FROM_EMAIL`, `FROM_NAME`, `OWNER_EMAIL`

`send-booking-mail.php` authorizes `admin_action` requests via Firebase ID token (`Authorization: Bearer ...`) and `ADMIN_EMAILS` allowlist.

## Secret Handling Rules

- Never commit real secrets to Git.
- Keep `.env*` files local/private.
- Keep production PHP config private on server (`/api/config.php`).
- Rotate credentials immediately if leaked.

## CI and Branch/PR Workflow

CI workflow: `.github/workflows/ci.yml`

Jobs:
- `Frontend (typecheck)`
- `Frontend (lint, build)`
- `Functions (lint, build)`

Recommended branch workflow:
1. `git switch main && git pull --ff-only`
2. `git switch -c <issue-branch>`
3. implement + run local checks
4. push branch
5. open PR into `main`
6. merge only after required checks are green (and review if required by ruleset)

## Deploy

Production deploy workflow: `.github/workflows/deploy-allinkl-ftps.yml`

Trigger:
- push to `main`

What it does:
1. installs root dependencies
2. validates required Firebase frontend secrets
3. builds frontend (`npm run build`)
4. uploads `dist/` via FTPS to all-inkl

Required GitHub Secrets (deploy workflow):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_DEFAULT_PROPERTY_ID`
- `VITE_MAIL_API_URL`
- `ALLINKL_SERVER`
- `ALLINKL_USER`
- `ALLINKL_PASS`
- `ALLINKL_SERVER_DIR`

Important deploy detail:
- FTPS deploy uploads only `dist/`.
- `dangerous-clean-slate: false` keeps existing server files untouched (for example `/api`).
- If `backend-php` changes, upload `/api` files separately.

### Manual production build

```bash
npm run build
```

Upload `dist/` contents to your web root.

## Firestore Rules and Indexes

- Rules file: `firestore.rules`
- Index source: `firestore.indexes.json`

Deploy:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Current booking overlap paths use indexed server-side queries (no full booking fetch + client filtering).

## PHP API Deployment Notes

If you use the PHP mail flow in production, make sure this exists on server:
- `/api/send-booking-mail.php`
- `/api/config.php` (private secrets)
- `/api/vendor/autoload.php` (from Composer install)

If you update PHP dependencies locally:

```bash
cd backend-php
composer install --no-dev --optimize-autoloader
```

## Troubleshooting

- `Firebase: auth/invalid-api-key`
  - check all required `VITE_FIREBASE_*` values in the build/runtime env
- `Konfiguration fehlt: VITE_DEFAULT_PROPERTY_ID`
  - set `VITE_DEFAULT_PROPERTY_ID`
- `VITE_MAIL_API_URL ist nicht gesetzt`
  - set `VITE_MAIL_API_URL` (or ensure `/api/send-booking-mail.php` is reachable)
- mail endpoint `502`
  - verify `/api` upload (`send-booking-mail.php`, `config.php`, `vendor/autoload.php`), SMTP credentials, and server logs
