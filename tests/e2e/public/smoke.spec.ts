import { expect, test, type Page } from "@playwright/test";

function monitorRuntimeErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  const onPageError = (error: Error) => {
    pageErrors.push(error.message);
  };
  const onConsole = (msg: { type(): string; text(): string }) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  return {
    pageErrors,
    consoleErrors,
    stop: () => {
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
    },
  };
}

async function runSmoke(
  page: Page,
  route: string,
  assertPage: (page: Page) => Promise<void>,
) {
  const runtime = monitorRuntimeErrors(page);
  await page.goto(route);
  await assertPage(page);
  await page.waitForTimeout(250);
  runtime.stop();

  expect(
    runtime.pageErrors,
    `Unhandled runtime errors detected on route "${route}"`,
  ).toEqual([]);
  expect(
    runtime.consoleErrors,
    `Console errors detected on route "${route}"`,
  ).toEqual([]);
}

test.describe("Public routes smoke", () => {
  test("home page renders navigation", async ({ page }) => {
    await runSmoke(page, "/", async (activePage) => {
      await expect(
        activePage.getByRole("link", { name: "Antjes Ankerplatz" }),
      ).toBeVisible();
      await expect(activePage.getByRole("link", { name: "Galerie" })).toBeVisible();
      await expect(activePage.getByRole("link", { name: "Preise" })).toBeVisible();
      await expect(activePage.getByRole("link", { name: "Buchen" })).toBeVisible();
      await expect(
        activePage.getByRole("heading", {
          level: 1,
          name: "Ferienwohnung Antjes Ankerplatz",
        }),
      ).toBeVisible();
      await expect(
        activePage.getByRole("button", { name: "Verfügbarkeit prüfen" }),
      ).toBeVisible();
      await expect(
        activePage.getByRole("heading", { level: 2, name: "Wohnungsbeschreibung" }),
      ).toBeVisible();
    });
  });

  test("gallery page renders heading", async ({ page }) => {
    await runSmoke(page, "/gallery", async (activePage) => {
      await expect(
        activePage.getByRole("heading", { level: 1, name: "Galerie" }),
      ).toBeVisible();
      await expect(activePage.getByText("Klick auf ein Bild")).toBeVisible();
      await expect(
        activePage
          .getByRole("button", { name: /^Ferienwohnung Ansicht/ })
          .first(),
      ).toBeVisible();
    });
  });

  test("prices page renders heading", async ({ page }) => {
    await runSmoke(page, "/prices", async (activePage) => {
      await expect(activePage.getByRole("heading", { level: 1 })).toContainText(
        "Preise",
      );
      await expect(
        activePage.getByRole("heading", { level: 2, name: "Saisonpreise" }),
      ).toBeVisible();
      await expect(
        activePage.getByRole("link", { name: "Jetzt Verfügbarkeit prüfen" }),
      ).toBeVisible();
    });
  });

  test("booking page renders CTA", async ({ page }) => {
    await runSmoke(page, "/book", async (activePage) => {
      await expect(activePage.getByRole("heading", { level: 1 })).toContainText(
        "Buchen",
      );
      await expect(activePage.getByText("Zeitraum wählen")).toBeVisible();
      await expect(activePage.getByText("Name")).toBeVisible();
      await expect(activePage.getByText("E-Mail")).toBeVisible();
      await expect(activePage.locator("#booking-form")).toBeVisible();
      await expect(
        activePage.getByRole("button", { name: "Anfrage senden" }),
      ).toBeVisible();
    });
  });
});
