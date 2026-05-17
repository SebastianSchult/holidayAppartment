import {
  getFirstProperty,
  getProperty,
  listSeasons,
  listTaxBands,
  listUnavailableNights,
} from "../../lib/db";
import type { Property, Season, TouristTaxBand } from "../../lib/schemas";
import { formatLocalISO } from "./utils";

export type BookingInitData = {
  propertyId: string;
  propertyName: string;
  currency: string;
  defaultRate: number;
  cleaningFee: number;
  seasons: (Season & { id: string })[];
  taxBands: (TouristTaxBand & { id: string })[];
};

export type BookingMailPayload = {
  propertyId: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  contact: {
    name: string;
    email: string;
    phone: string;
    language: "de" | "en";
    address: {
      street: string;
      zip: string;
      city: string;
      country: string;
    };
  };
  message: string;
  language: "de" | "en";
};

function getEnvPropertyId(): string | null {
  const envId = (
    import.meta as unknown as { env: Record<string, string | undefined> }
  ).env.VITE_DEFAULT_PROPERTY_ID?.trim();
  return envId || null;
}

function mapPropertyToInitData(
  propertyId: string,
  propertyData: Property,
  seasons: (Season & { id: string })[],
  taxBands: (TouristTaxBand & { id: string })[],
  defaultPropertyName: string,
): BookingInitData {
  const sortedSeasons = [...seasons].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const sortedTaxBands = [...taxBands].sort((a, b) =>
    (a.zone || "").localeCompare(b.zone || ""),
  );

  return {
    propertyId,
    propertyName: propertyData.name || defaultPropertyName,
    currency: propertyData.currency || "EUR",
    defaultRate: propertyData.defaultNightlyRate ?? 0,
    cleaningFee: propertyData.cleaningFee ?? 0,
    seasons: sortedSeasons,
    taxBands: sortedTaxBands,
  };
}

export async function loadBookingInitData(
  defaultPropertyName: string,
): Promise<BookingInitData> {
  const envId = getEnvPropertyId();

  if (envId) {
    const [propResult, seasonsResult, taxBandsResult] = await Promise.allSettled([
      getProperty(envId),
      listSeasons(envId),
      listTaxBands(envId),
    ]);

    const propertyData = propResult.status === "fulfilled" ? propResult.value : null;
    const seasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : [];
    const taxBands = taxBandsResult.status === "fulfilled" ? taxBandsResult.value : [];

    if (propertyData) {
      return mapPropertyToInitData(
        envId,
        propertyData,
        seasons,
        taxBands,
        defaultPropertyName,
      );
    }
  }

  const firstProperty = await getFirstProperty();
  if (!firstProperty) {
    throw new Error("booking.noProperty");
  }

  const [seasonsResult, taxBandsResult] = await Promise.allSettled([
    listSeasons(firstProperty.id),
    listTaxBands(firstProperty.id),
  ]);

  return mapPropertyToInitData(
    firstProperty.id,
    firstProperty.data,
    seasonsResult.status === "fulfilled" ? seasonsResult.value : [],
    taxBandsResult.status === "fulfilled" ? taxBandsResult.value : [],
    defaultPropertyName,
  );
}

export async function loadUnavailableDates(propertyId: string): Promise<Date[]> {
  const now = new Date();
  const fromISO = formatLocalISO(now);
  const oneYearAhead = new Date(now);
  oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
  const toISO = formatLocalISO(oneYearAhead);
  const dates = await listUnavailableNights(propertyId, fromISO, toISO);
  return dates.map((date) => new Date(`${date}T12:00:00`));
}

export async function sendBookingRequestMail(payload: BookingMailPayload): Promise<{
  sent: boolean;
  reason: string;
}> {
  const mailUrl =
    (import.meta.env.VITE_MAIL_API_URL as string | undefined)?.trim() ||
    "/api/send-booking-mail.php";

  try {
    const response = await fetch(mailUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "booking_request",
        propertyId: payload.propertyId,
        propertyName: payload.propertyName,
        startDate: payload.startDate,
        endDate: payload.endDate,
        adults: payload.adults,
        children: payload.children,
        contact: payload.contact,
        message: payload.message,
        language: payload.language,
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; status?: { owner?: string; guest?: string } }
      | null;

    const sent = response.ok && result?.ok !== false;
    if (sent) {
      return { sent: true, reason: "" };
    }

    const reason =
      [result?.error, result?.status?.owner, result?.status?.guest]
        .filter(Boolean)
        .join(" | ") || `HTTP ${response.status}`;

    return { sent: false, reason };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "fetch_failed";
    return { sent: false, reason };
  }
}
