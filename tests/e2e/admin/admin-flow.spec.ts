import { expect, test } from "@playwright/test";

test.describe("Admin flow", () => {
  test("unauthenticated users are redirected to admin login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByLabel(/e-mail|email/i)).toBeVisible();
    await expect(page.getByLabel(/passwort|password/i)).toBeVisible();
  });

  test.fixme("critical workflow with real admin user", async () => {
    // Re-enable once dedicated admin test account and deterministic test fixtures are available.
    // Scope:
    // 1) authenticate as dedicated admin test user
    // 2) open admin dashboard
    // 3) execute approve/decline/cancel/delete transitions
    // 4) verify table and calendar state updates
  });
});
