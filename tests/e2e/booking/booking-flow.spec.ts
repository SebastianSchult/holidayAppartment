import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

function parseEnvLine(filePath: string, key: string): string | null {
  if (!existsSync(filePath)) return null;
  const source = readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^${key}=(.*)$`, "m");
  const match = source.match(pattern);
  if (!match?.[1]) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function resolveDefaultPropertyId(): string {
  const fromProcess = process.env.VITE_DEFAULT_PROPERTY_ID?.trim();
  if (fromProcess) return fromProcess;

  const files = [".env.local", ".env", ".env.production"];
  for (const file of files) {
    const value = parseEnvLine(file, "VITE_DEFAULT_PROPERTY_ID");
    if (value) return value;
  }

  throw new Error("Missing VITE_DEFAULT_PROPERTY_ID for booking E2E test.");
}

function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function calendarLabel(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function openMonthForDate(page: Page, date: Date): Promise<string> {
  const label = calendarLabel(date);
  for (let i = 0; i < 180; i += 1) {
    if (await page.getByRole("button", { name: label, exact: true }).count()) {
      return label;
    }
    await page.locator("button.rdp-button_next").click();
  }
  throw new Error(`Could not find calendar day button for ${label}`);
}

async function pickRange(page: Page, startDate: Date, endDate: Date): Promise<void> {
  const startLabel = await openMonthForDate(page, startDate);
  const startButton = page.getByRole("button", { name: startLabel, exact: true });
  await expect(startButton).toBeVisible();
  await expect(startButton).toBeEnabled();
  await startButton.click();
  // Range mode keeps the previous `from` date when a full range exists.
  // Clicking the same day again anchors start = end = startDate.
  const anchoredStartButton = page.getByRole("button", { name: startLabel });
  await expect(anchoredStartButton).toBeEnabled();
  await anchoredStartButton.click();

  const endLabel = await openMonthForDate(page, endDate);
  const endButton = page.getByRole("button", { name: endLabel, exact: true });
  await expect(endButton).toBeVisible();
  await expect(endButton).toBeEnabled();
  await endButton.click();
}

async function waitForAvailabilityState(
  page: Page,
  expected: "available" | "unavailable"
): Promise<void> {
  await expect
    .poll(
      async () => {
        if (await page.getByText("Zeitraum ist aktuell verfügbar.").isVisible()) return "available";
        if (await page.getByText("Zeitraum ist leider bereits belegt.").isVisible()) return "unavailable";
        if (await page.getByText("Verfügbarkeit wird geprüft …").isVisible()) return "checking";
        return "idle";
      },
      { timeout: 15_000 }
    )
    .toBe(expected);
}

async function findAvailableRange(
  page: Page,
  propertyId: string,
  nights: number
): Promise<{ startDate: Date; endDate: Date }> {
  const result = await page.evaluate(
    async ({ propertyId: id, nights: n }) => {
      // @ts-expect-error Browser-side path is resolved by Vite dev server.
      const db = await import("/src/lib/db.ts");
      const isRangeAvailable: (propertyId: string, startISO: string, endISO: string) => Promise<boolean> =
        db.isRangeAvailable;
      const canCreatePublicHoldsForRange: (
        propertyId: string,
        startISO: string,
        endISO: string
      ) => Promise<boolean> = db.canCreatePublicHoldsForRange;

      function toISO(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }

      const base = new Date();
      base.setHours(0, 0, 0, 0);
      base.setDate(base.getDate() + 14);

      const maxOffsetDays = 3650;
      const coarseStep = 21;

      for (let offset = 0; offset <= maxOffsetDays; offset += coarseStep) {
        const start = new Date(base);
        start.setDate(start.getDate() + offset);
        const end = new Date(start);
        end.setDate(end.getDate() + n);

        const startISO = toISO(start);
        const endISO = toISO(end);
        if (
          (await isRangeAvailable(id, startISO, endISO)) &&
          (await canCreatePublicHoldsForRange(id, startISO, endISO))
        ) {
          const refineStart = Math.max(0, offset - coarseStep);
          for (let day = refineStart; day <= offset; day += 1) {
            const s = new Date(base);
            s.setDate(s.getDate() + day);
            const e = new Date(s);
            e.setDate(e.getDate() + n);
            const sISO = toISO(s);
            const eISO = toISO(e);
            if (
              (await isRangeAvailable(id, sISO, eISO)) &&
              (await canCreatePublicHoldsForRange(id, sISO, eISO))
            ) {
              return { startISO: sISO, endISO: eISO };
            }
          }
          return { startISO, endISO };
        }
      }

      return null;
    },
    { propertyId, nights }
  );

  if (!result) {
    throw new Error("No available booking range found in scan window.");
  }

  return {
    startDate: parseISODate(result.startISO),
    endDate: parseISODate(result.endISO),
  };
}

test.describe("Booking flow", () => {
  test("happy path creates booking and shows success feedback", async ({ page }) => {
    test.setTimeout(60_000);

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const mailPayloads: unknown[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.route("**/send-booking-mail.php*", async (route) => {
      const payload = route.request().postDataJSON();
      mailPayloads.push(payload);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, sent: { owner: true, guest: true } }),
      });
    });

    await page.goto("/book");
    await expect(page.locator("#booking-form")).toBeVisible();

    const propertyId = resolveDefaultPropertyId();
    const { startDate, endDate } = await findAvailableRange(page, propertyId, 3);

    await pickRange(page, startDate, endDate);
    await waitForAvailabilityState(page, "available");

    await page.getByLabel("Name").fill("Playwright E2E");
    await page.getByLabel("E-Mail").fill("playwright.e2e@example.com");
    await page.getByLabel("Straße & Nr.").fill("Testweg 1");
    await page.getByLabel("PLZ").fill("27476");
    await page.getByLabel("Ort").fill("Cuxhaven");
    await page.getByLabel("Land").fill("Deutschland");
    await page.getByLabel("Telefon (optional)").fill("+49 123 456789");
    await page.getByLabel("Nachricht (optional)").fill("Playwright happy path test booking.");

    const submitButton = page.getByRole("button", { name: "Anfrage senden" });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    const successToast = page.getByRole("status").filter({
      hasText: /Vielen Dank! Deine Anfrage wurde übermittelt/,
    });
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText("Bestätigungsmail wurde versendet");

    expect(mailPayloads.length, "Expected exactly one mocked mail request.").toBe(1);
    const payload = (mailPayloads[0] || {}) as {
      type?: string;
      contact?: { email?: string };
    };
    expect(payload.type).toBe("booking_request");
    expect(payload.contact?.email).toBe("playwright.e2e@example.com");

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
