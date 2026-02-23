import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";

type SeededBooking = {
  id: string;
  email: string;
};

function parseEnvLine(filePath: string, key: string): string | null {
  if (!existsSync(filePath)) return null;
  const source = readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^${key}=(.*)$`, "m");
  const match = source.match(pattern);
  if (!match?.[1]) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function resolveEnvValue(key: string): string | null {
  const fromProcess = process.env[key]?.trim();
  if (fromProcess) return fromProcess;

  const files = [".env.local", ".env", ".env.production"];
  for (const file of files) {
    const value = parseEnvLine(file, key);
    if (value) return value;
  }
  return null;
}

async function ensureAdminSession(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/admin");
  if (page.url().includes("/admin/login")) {
    await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel("Passwort").fill(password);
    await page.getByRole("button", { name: "Anmelden" }).click();
  }

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
}

async function openBookingsTab(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Anfragen" }).click();
  await expect(page.getByRole("heading", { name: "Buchungsanfragen" })).toBeVisible();
}

async function searchBookingRow(page: Page, email: string): Promise<Locator> {
  const searchInput = page.getByRole("searchbox", { name: "Suche" });
  await searchInput.fill(email);
  const row = page.locator("tbody tr", { hasText: email }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  return row;
}

async function waitForRowStatus(row: Locator, status: "requested" | "approved" | "declined" | "cancelled"): Promise<void> {
  await expect
    .poll(async () => ((await row.textContent()) || "").toLowerCase(), {
      timeout: 15_000,
    })
    .toContain(status);
}

async function seedRequestedBooking(
  page: Page,
  propertyId: string,
  marker: string
): Promise<SeededBooking> {
  const result = await page.evaluate(
    async ({ propertyId: id, marker: seed }) => {
      // @ts-expect-error Browser-side import path is resolved by Vite.
      const db = await import("/src/lib/db.ts");
      const createBookingRequest: (data: {
        propertyId: string;
        startDate: string;
        endDate: string;
        adults: number;
        children: number;
        status: "requested";
        contact: {
          name: string;
          email: string;
          phone?: string;
          address: { street: string; zip: string; city: string; country: string };
        };
        message?: string;
        summary: {
          nights: number;
          nightlyTotal: number;
          cleaningFee: number;
          touristTax: number;
          grandTotal: number;
          currency: "EUR";
        };
      }) => Promise<{ id: string }> = db.createBookingRequest;
      const isRangeAvailable: (propertyId: string, startISO: string, endISO: string) => Promise<boolean> =
        db.isRangeAvailable;

      function toISO(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }

      const nights = 3;
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      base.setDate(base.getDate() + 21);

      let startISO = "";
      let endISO = "";
      for (let offset = 0; offset <= 3650; offset += 7) {
        const start = new Date(base);
        start.setDate(start.getDate() + offset);
        const end = new Date(start);
        end.setDate(end.getDate() + nights);

        const candidateStart = toISO(start);
        const candidateEnd = toISO(end);
        if (await isRangeAvailable(id, candidateStart, candidateEnd)) {
          startISO = candidateStart;
          endISO = candidateEnd;
          break;
        }
      }

      if (!startISO || !endISO) {
        throw new Error("Could not find available range for admin E2E seed booking.");
      }

      const uniquePart = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const email = `e2e-admin-${seed}-${uniquePart}@example.com`;

      const ref = await createBookingRequest({
        propertyId: id,
        startDate: startISO,
        endDate: endISO,
        adults: 2,
        children: 0,
        status: "requested",
        contact: {
          name: `E2E ${seed}`,
          email,
          phone: "+49 123 456789",
          address: {
            street: "Testweg 1",
            zip: "27476",
            city: "Cuxhaven",
            country: "Deutschland",
          },
        },
        message: `E2E admin workflow (${seed})`,
        summary: {
          nights,
          nightlyTotal: 300,
          cleaningFee: 0,
          touristTax: 19.8,
          grandTotal: 319.8,
          currency: "EUR",
        },
      });

      return { id: ref.id, email };
    },
    { propertyId, marker }
  );

  return result;
}

async function cleanupBooking(page: Page, bookingId: string): Promise<void> {
  await page.evaluate(
    async ({ bookingId: id }) => {
      // @ts-expect-error Browser-side import path is resolved by Vite.
      const firebase = await import("/src/lib/firebase.ts");
      // @ts-expect-error Browser-side import path is resolved by Vite.
      const dbMod = await import("/src/lib/db.ts");
      const firestore = await import("firebase/firestore");

      const ref = firestore.doc(firebase.db, "bookings", id);
      const snap = await firestore.getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data() as {
        propertyId?: string;
        startDate?: string;
        endDate?: string;
      };

      if (data.propertyId && data.startDate && data.endDate) {
        try {
          await dbMod.freeNightsForBooking({
            id: snap.id,
            propertyId: data.propertyId,
            startDate: data.startDate,
            endDate: data.endDate,
          });
        } catch {
          // best effort
        }
        try {
          await dbMod.releaseHoldsForRange(data.propertyId, data.startDate, data.endDate);
        } catch {
          // best effort
        }
      }

      try {
        await firestore.deleteDoc(ref);
      } catch {
        // best effort
      }
    },
    { bookingId }
  );
}

test.describe("Admin flow", () => {
  test("critical workflow covers approve/cancel and decline transitions", async ({ page }) => {
    test.setTimeout(120_000);

    const adminEmail = resolveEnvValue("E2E_ADMIN_EMAIL");
    const adminPassword = resolveEnvValue("E2E_ADMIN_PASSWORD");
    const propertyId = resolveEnvValue("VITE_DEFAULT_PROPERTY_ID");

    test.skip(
      !adminEmail || !adminPassword || !propertyId,
      "Set E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD and VITE_DEFAULT_PROPERTY_ID to run admin E2E."
    );

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const leftoverBookingIds: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.route("**/send-booking-mail.php*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, sent: { owner: true, guest: true } }),
      });
    });

    try {
      await ensureAdminSession(page, adminEmail as string, adminPassword as string);

      const approveFlowBooking = await seedRequestedBooking(page, propertyId as string, "approve");
      leftoverBookingIds.push(approveFlowBooking.id);

      await page.goto("/admin");
      await openBookingsTab(page);

      const approveRow = await searchBookingRow(page, approveFlowBooking.email);
      await waitForRowStatus(approveRow, "requested");

      await approveRow.getByRole("button", { name: "Bestätigen" }).click();
      await expect(page.getByRole("status")).toContainText(/Anfrage bestätigt\./);
      await waitForRowStatus(approveRow, "approved");

      await approveRow.getByRole("button", { name: "Stornieren" }).click();
      await expect(page.getByRole("dialog", { name: "Buchung stornieren" })).toBeVisible();
      await page.getByRole("button", { name: "Ja, stornieren" }).click();
      await expect(page.getByRole("status")).toContainText(/Buchung storniert\./);
      await waitForRowStatus(approveRow, "cancelled");

      await approveRow.getByRole("button", { name: "Löschen" }).click();
      await expect(page.getByRole("dialog", { name: "Eintrag löschen" })).toBeVisible();
      await page.getByRole("button", { name: "Ja, löschen" }).click();
      await expect(page.getByRole("status")).toContainText(/Eintrag gelöscht\./);
      await expect(page.locator("tbody tr", { hasText: approveFlowBooking.email })).toHaveCount(0, { timeout: 15_000 });
      const approveIndex = leftoverBookingIds.indexOf(approveFlowBooking.id);
      if (approveIndex >= 0) leftoverBookingIds.splice(approveIndex, 1);

      const declineFlowBooking = await seedRequestedBooking(page, propertyId as string, "decline");
      leftoverBookingIds.push(declineFlowBooking.id);

      await page.goto("/admin");
      await openBookingsTab(page);

      const declineRow = await searchBookingRow(page, declineFlowBooking.email);
      await waitForRowStatus(declineRow, "requested");

      await declineRow.getByRole("button", { name: "Ablehnen" }).click();
      await expect(page.getByRole("status")).toContainText(/Anfrage abgelehnt\./);
      await waitForRowStatus(declineRow, "declined");

      await declineRow.getByRole("button", { name: "Löschen" }).click();
      await expect(page.getByRole("dialog", { name: "Eintrag löschen" })).toBeVisible();
      await page.getByRole("button", { name: "Ja, löschen" }).click();
      await expect(page.getByRole("status")).toContainText(/Eintrag gelöscht\./);
      await expect(page.locator("tbody tr", { hasText: declineFlowBooking.email })).toHaveCount(0, { timeout: 15_000 });
      const declineIndex = leftoverBookingIds.indexOf(declineFlowBooking.id);
      if (declineIndex >= 0) leftoverBookingIds.splice(declineIndex, 1);

      await page.getByRole("tab", { name: "Kalender" }).click();
      await expect(page.getByRole("heading", { name: "Kalender" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Belegungskalender" })).toBeVisible();
    } finally {
      for (const bookingId of leftoverBookingIds) {
        await cleanupBooking(page, bookingId);
      }
    }

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
