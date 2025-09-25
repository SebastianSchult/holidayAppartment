import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { sendMail } from "./mailer.js";
import {
  bookingRequestOwner,
  bookingRequestGuestAck,
  bookingApprovedGuest,
  bookingDeclinedGuest,
  bookingCancelledGuest,
} from "./emailTemplates.js";
setGlobalOptions({ 
  region: "europe-west3"
});
admin.initializeApp();

const OWNER_EMAIL = process.env.OWNER_EMAIL || "contact@sebastian-schult-dev.de";

// Neue Anfrage -> Mail an Vermieter + Eingangsbestätigung an Gast
export const onBookingCreate = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const snap = event.data; // DocumentSnapshot
  if (!snap) return;
  const data = snap.data() as any;

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
  const before = event.data?.before.data() as any | undefined;
  const after = event.data?.after.data() as any | undefined;
  if (!before || !after) return;

  const statusBefore = before.status;
  const statusAfter = after.status;
  if (statusBefore === statusAfter) return;

  const contactEmail: string | undefined = after?.contact?.email;
  const contactName: string | undefined = after?.contact?.name;
  const { startDate, endDate, adults, children } = after as any;
  if (!contactEmail) return;

  try {
    if (statusAfter === "approved") {
      await sendMail(
        contactEmail,
        "Buchung bestätigt",
        bookingApprovedGuest({ startDate, endDate, adults, children, contactName })
      );
    } else if (statusAfter === "declined") {
      await sendMail(
        contactEmail,
        "Buchung leider abgelehnt",
        bookingDeclinedGuest({ startDate, endDate, contactName })
      );
    } else if (statusAfter === "cancelled") {
      await sendMail(
        contactEmail,
        "Buchung storniert",
        bookingCancelledGuest({ startDate, endDate, contactName })
      );
    }
  } catch (e) {
    console.error("send status mail failed:", e);
  }
});