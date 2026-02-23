import { test } from "@playwright/test";

test.describe.skip("Booking flow", () => {
  test("happy path (planned)", async () => {
    // Scope for follow-up ticket:
    // 1) Fill booking form with deterministic test data.
    // 2) Submit request.
    // 3) Assert user-visible success feedback.
    // 4) Keep external mail path deterministic (mock/stub strategy).
  });
});
