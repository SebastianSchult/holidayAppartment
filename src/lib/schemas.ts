// src/lib/schemas.ts
import { z } from "zod";

/** Firestore collection names (zentral, damit wir sie überall konsistent nutzen) */
export const COL = {
  properties: "properties",
  seasons: "seasons",
  bookings: "bookings",
  inventory: "inventory",
  users: "users",
  taxBands: "taxBands",
  roles: "roles",
} as const;

/** ISO-Datum (YYYY-MM-DD) */
export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte Datum als YYYY-MM-DD angeben");

/** Monat-Tag (MM-DD) für wiederkehrende Zeiträume (z. B. 01-01 bis 01-07) */
export const MonthDay = z
  .string()
  .regex(/^\d{2}-\d{2}$/, "Bitte als MM-DD angeben (z. B. 01-01 für 1. Januar)");

/** Allgemeine Anschrift (optional, frei verwendbar) */
export const AddressSchema = z.object({
  street: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});
export type Address = z.infer<typeof AddressSchema>;

/** Ein wiederkehrender Zeitraum innerhalb eines Jahres, endMD ist exklusiv */
export const TouristTaxRangeSchema = z.object({
  startMD: MonthDay, // inklusiv
  endMD: MonthDay,   // exklusiv
});
export type TouristTaxRange = z.infer<typeof TouristTaxRangeSchema>;

/** Unterkunft/Objekt */
export const PropertySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2), // für URLs
  address: AddressSchema.default({}),
  maxGuests: z.number().int().min(1),
  checkInHour: z.number().int().min(0).max(23).default(15),
  checkOutHour: z.number().int().min(0).max(23).default(10),
  currency: z.string().default("EUR"),
  defaultNightlyRate: z.number().nonnegative(),  // Standardpreis pro Nacht
  cleaningFee: z.number().nonnegative().default(0), // Endreinigung
  description: z.string().optional(),
  images: z.array(z.string().url().or(z.string().min(1))).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Property = z.infer<typeof PropertySchema>;

/** Saisonpreise (einfach: kompletter Nachtpreis in Saison; feinere Modelle gehen später) */
export const SeasonSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  name: z.string().min(1),
  startDate: IsoDate, // inklusiv
  endDate: IsoDate,   // exklusiv oder inklusiv – wir behandeln sie in pricing.ts konsistent
  nightlyRate: z.number().nonnegative(),
  minNights: z.number().int().min(1).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Season = z.infer<typeof SeasonSchema>;

/** Buchung / Booking Request
 * Gäste können Anfragen mit status "requested" erstellen.
 * Admins können später status auf "approved" / "declined" / "cancelled" setzen.
 */
export const BookingSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  startDate: IsoDate, // erste Nacht (YYYY-MM-DD)
  endDate: IsoDate,   // Abreise-Tag (letzte Nacht ist endDate - 1)

  // Gäste-Zusammensetzung
  adults: z.number().int().nonnegative().default(2),   // >= 16 Jahre
  children: z.number().int().nonnegative().default(0), // 0–15 Jahre

  // Status-Lifecycle
  status: z.enum(["requested", "approved", "declined", "cancelled"]).default("requested"),

  // Kontakt- & Nachrichtendaten für die Anfrage
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional().default(""),
    address: AddressSchema.optional().default({}),
  }),
  message: z.string().optional().default(""),

  // Optional: Client-seitige Preis-Zusammenfassung (Server sollte nie blind vertrauen)
  summary: z
    .object({
      nights: z.number().int().nonnegative(),
      nightlyTotal: z.number().nonnegative(),
      cleaningFee: z.number().nonnegative(),
      touristTax: z.number().nonnegative(),
      grandTotal: z.number().nonnegative(),
      currency: z.string().default("EUR"),
    })
    .optional(),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Booking = z.infer<typeof BookingSchema>;

/** Hilfstypen für Inventar-Nächte (Transaktions-Reservierung – kommt in Sprint 2/3) */
export const NightHoldSchema = z.object({
  propertyId: z.string(),
  date: IsoDate, // YYYY-MM-DD
  bookingId: z.string().optional(),
  source: z.enum(["direct", "bookingcom", "ical"]).default("direct"),
  createdAt: z.date().default(() => new Date()),
});
export type NightHold = z.infer<typeof NightHoldSchema>;

/** Kurtaxe (Tourist Tax) je Zone/Band, wiederkehrend pro Jahr per Monat-Tag-Bereichen */
export const TouristTaxBandSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  zone: z.string().default("Kurzone 1"),
  label: z.string().min(1), // z. B. "Haupt-/Zwischensaison" oder "Nebensaison"
  currency: z.string().default("EUR"),
  rate: z.number().nonnegative(), // Preis pro Person und Nacht
  ranges: z.array(TouristTaxRangeSchema).min(1),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type TouristTaxBand = z.infer<typeof TouristTaxBandSchema>;

/** Rollen-Dokument für Benutzer (roles/{uid}) */
export const RoleSchema = z.object({
  id: z.string().optional(), // = uid
  admin: z.boolean().default(false),
});
export type Role = z.infer<typeof RoleSchema>;