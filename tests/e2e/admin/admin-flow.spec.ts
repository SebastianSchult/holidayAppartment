import { test } from "@playwright/test";

test.describe.skip("Admin flow", () => {
  test("critical workflow (temporarily disabled)", async () => {
    // Temporarily disabled until admin test data and access are stabilized.
    // Scope when re-enabled:
    // 1) Authenticate as dedicated admin test user.
    // 2) Open admin dashboard.
    // 3) Execute status change actions (approve/decline/cancel/delete).
    // 4) Verify updated state in table/calendar.
  });
});
