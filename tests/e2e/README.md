# E2E Strategy (Playwright Baseline)

This folder defines the baseline E2E strategy for the project.

## Scope

- `public/`:
  - smoke coverage for public routes (`/`, `/gallery`, `/prices`, `/book`)
  - checks route render + key UI blocks + no uncaught runtime errors (`pageerror` / `console.error`)
- `booking/`:
  - happy-path booking request flow (form fill, submit, success feedback)
  - mail endpoint is stubbed in test for deterministic runs
- `admin/`:
  - critical workflow with authenticated admin session
  - verifies status transitions in UI: approve, cancel, decline, delete
  - verifies calendar tab visibility after actions

Current baseline executes public smoke tests, booking happy-path flow and admin critical workflow tests.

## Test Structure and Naming

- Directory by business domain:
  - `tests/e2e/public/*`
  - `tests/e2e/booking/*`
  - `tests/e2e/admin/*`
- File naming:
  - use `*.spec.ts`
- Prefer one user flow per spec file.
- Keep selectors user-centric (`getByRole`, visible text) instead of CSS implementation details.

## Environment Strategy

`playwright.config.ts` uses:

- `PLAYWRIGHT_BASE_URL`:
  - if set, tests run against that external URL (CI/staging/preview deployments)
- fallback local URL:
  - `http://127.0.0.1:4173`
  - Playwright starts local dev server automatically:
    - `npm run dev -- --host 127.0.0.1 --port 4173`

This allows two modes:

1. Local baseline (default): no extra setup beyond normal frontend env
2. CI/staging: provide `PLAYWRIGHT_BASE_URL` and run against deployed target

## Auth and Test Data Strategy

- Do not use production admin accounts for E2E.
- Booking E2E should use deterministic test data and avoid flaky external dependencies (mock/stub mail path where needed).
- Admin E2E requires:
  - `E2E_ADMIN_EMAIL`
  - `E2E_ADMIN_PASSWORD`
- Admin E2E creates isolated booking records and removes leftovers in teardown to avoid data pollution.
