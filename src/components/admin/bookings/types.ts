import type { Booking } from "../../../lib/schemas";

export type BookingRow = Booking & { id: string };

export type ConfirmState =
  | null
  | { kind: "cancel" | "delete"; booking: BookingRow };

export type BusyState = false | "approve" | "decline";
