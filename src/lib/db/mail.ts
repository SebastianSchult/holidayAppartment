import type { Booking } from "../schemas";

const MAIL_API_URL =
  (import.meta.env.VITE_MAIL_API_URL as string | undefined)?.trim() ||
  "/api/send-booking-mail.php";

export async function sendAdminActionMail(
  action: "approved" | "declined" | "cancelled",
  booking: Booking & { id: string },
  propertyName?: string,
): Promise<{ ok: boolean; detail?: string }> {
  if (!MAIL_API_URL) {
    console.warn("[mail] admin action skipped - VITE_MAIL_API_URL missing");
    return { ok: false, detail: "mail_api_missing" };
  }

  const { auth } = await import("../firebaseAuth");
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("[mail] admin action skipped - no authenticated user");
    return { ok: false, detail: "admin_not_authenticated" };
  }

  try {
    const idToken = await currentUser.getIdToken();
    const response = await fetch(MAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        type: "admin_action",
        action,
        bookingId: booking.id,
        propertyId: booking.propertyId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        adults: booking.adults,
        children: booking.children,
        contact: booking.contact,
        language: booking.contact.language ?? "de",
        message: booking.message ?? "",
        status: booking.status,
        propertyName,
      }),
    });

    const text = await response.text();
    let payload: { ok?: boolean; detail?: unknown; error?: string } | null = null;
    if (text) {
      try {
        payload = JSON.parse(text) as { ok?: boolean; detail?: unknown; error?: string };
      } catch {
        payload = null;
      }
    }

    if (!response.ok || payload?.ok === false) {
      const detailSource = (payload?.detail ?? payload?.error ?? text) || String(response.status);
      const detail =
        typeof detailSource === "string" ? detailSource : JSON.stringify(detailSource);
      console.warn("[mail] admin action failed:", response.status, detail);
      return { ok: false, detail };
    }

    return {
      ok: true,
      detail: typeof payload?.detail === "string" ? payload.detail : undefined,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "fetch_failed";
    console.warn("[mail] admin action error:", error);
    return { ok: false, detail };
  }
}
