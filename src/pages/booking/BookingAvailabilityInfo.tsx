type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function BookingAvailabilityInfo({
  availability,
  nights,
  minNights,
  t,
}: {
  availability: "idle" | "checking" | "available" | "unavailable";
  nights: number;
  minNights: number;
  t: TranslateFn;
}) {
  return (
    <>
      {availability === "checking" && (
        <p className="text-sm text-slate-500">{t("booking.availabilityChecking")}</p>
      )}
      {availability === "available" && (
        <p className="text-sm text-green-700">{t("booking.availabilityAvailable")}</p>
      )}
      {availability === "unavailable" && (
        <p className="text-sm text-red-700">{t("booking.availabilityUnavailable")}</p>
      )}
      {nights > 0 && nights < minNights && (
        <p className="text-sm text-amber-700">{t("booking.minStay", { nights: minNights })}</p>
      )}
    </>
  );
}
