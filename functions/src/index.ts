import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {sendMail} from "./mailer.js";
import {
  bookingRequestOwner,
  bookingRequestGuestAck,
  bookingApprovedGuest,
  bookingDeclinedGuest,
  bookingCancelledGuest,
} from "./emailTemplates.js";
setGlobalOptions({
  region: "europe-west3",
});
admin.initializeApp();

const OWNER_EMAIL = process.env.OWNER_EMAIL || "contact@sebastian-schult-dev.de";

type BookingContact = {
  name?: string;
  email?: string;
  phone?: string;
};

type BookingMailData = {
  propertyId?: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  contact?: BookingContact;
  message?: string;
  summary?: unknown;
  status?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function parseContact(value: unknown): BookingContact | undefined {
  const obj = asRecord(value);
  if (!obj) return undefined;
  return {
    name: asString(obj.name),
    email: asString(obj.email),
    phone: asString(obj.phone),
  };
}

function parseBookingMailData(value: unknown): BookingMailData | null {
  const obj = asRecord(value);
  if (!obj) return null;

  return {
    propertyId: asString(obj.propertyId),
    startDate: asString(obj.startDate) ?? "",
    endDate: asString(obj.endDate) ?? "",
    adults: asNumber(obj.adults) ?? 0,
    children: asNumber(obj.children) ?? 0,
    contact: parseContact(obj.contact),
    message: asString(obj.message),
    summary: obj.summary,
    status: asString(obj.status),
  };
}

// Neue Anfrage -> Mail an Vermieter + Eingangsbestätigung an Gast
export const onBookingCreate = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const snap = event.data; // DocumentSnapshot
  if (!snap) return;
  const data = parseBookingMailData(snap.data());
  if (!data) return;

  const {
    propertyId,
    startDate,
    endDate,
    adults,
    children,
    contact,
    message,
    summary,
  } = data;

  // Vermieter
  try {
    const htmlOwner = bookingRequestOwner({
      propertyId,
      startDate,
      endDate,
      adults,
      children,
      contactName: contact?.name,
      contactEmail: contact?.email,
      contactPhone: contact?.phone,
      message,
      summary,
    });
    await sendMail(OWNER_EMAIL, "Neue Buchungsanfrage", htmlOwner);
  } catch (e) {
    console.error("send owner request mail failed:", e);
  }

  // Gast (Eingangsbestätigung)
  if (contact?.email) {
    try {
      const htmlGuest = bookingRequestGuestAck({
        startDate,
        endDate,
        adults,
        children,
        contactName: contact?.name,
      });
      await sendMail(contact.email, "Anfrage eingegangen – wir melden uns", htmlGuest);
    } catch (e) {
      console.error("send guest ack mail failed:", e);
    }
  }
});

// Statuswechsel -> Mail an Gast
export const onBookingUpdate = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  const before = parseBookingMailData(event.data?.before.data());
  const after = parseBookingMailData(event.data?.after.data());
  if (!before || !after) return;

  const statusBefore = before.status;
  const statusAfter = after.status;
  if (!statusAfter || statusBefore === statusAfter) return;

  const contactEmail: string | undefined = after?.contact?.email;
  const contactName: string | undefined = after?.contact?.name;
  const {startDate, endDate, adults, children} = after;
  if (!contactEmail) return;

  try {
    if (statusAfter === "approved") {
      await sendMail(
        contactEmail,
        "Buchung bestätigt",
        bookingApprovedGuest({startDate, endDate, adults, children, contactName})
      );
    } else if (statusAfter === "declined") {
      await sendMail(
        contactEmail,
        "Buchung leider abgelehnt",
        bookingDeclinedGuest({startDate, endDate, contactName})
      );
    } else if (statusAfter === "cancelled") {
      await sendMail(
        contactEmail,
        "Buchung storniert",
        bookingCancelledGuest({startDate, endDate, contactName})
      );
    }
  } catch (e) {
    console.error("send status mail failed:", e);
  }
});
