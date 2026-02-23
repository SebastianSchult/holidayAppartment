import { expect, test } from "@playwright/test";

test.describe("Public routes smoke", () => {
  test("home page renders navigation", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Antjes Ankerplatz" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Galerie" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Preise" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Buchen" })).toBeVisible();
  });

  test("gallery page renders heading", async ({ page }) => {
    await page.goto("/gallery");
    await expect(
      page.getByRole("heading", { level: 1, name: "Galerie" }),
    ).toBeVisible();
  });

  test("prices page renders heading", async ({ page }) => {
    await page.goto("/prices");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Preise",
    );
  });

  test("booking page renders CTA", async ({ page }) => {
    await page.goto("/book");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Buchen",
    );
    await expect(
      page.getByRole("button", { name: "Anfrage senden" }),
    ).toBeVisible();
  });
});
