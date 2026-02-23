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
  - planned critical admin workflow (auth + status actions)

Current baseline executes public smoke tests and the booking happy-path flow.
`admin/` remains a skipped placeholder for follow-up issues.

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
- Add a dedicated admin test account in follow-up admin E2E ticket.
- Booking E2E should use deterministic test data and avoid flaky external dependencies (mock/stub mail path where needed).
