import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createBookingRequest, isRangeAvailable } from "../lib/db";
import type { Property, Season, TouristTaxBand } from "../lib/schemas";
import { priceForStay, touristTaxForStay } from "../lib/pricing";
import { useLanguage, useT } from "../i18n/useLanguage";
import { Field } from "./booking/BookingField";
import { BookingContactFields } from "./booking/BookingContactFields";
import { BookingAvailabilityInfo } from "./booking/BookingAvailabilityInfo";
import { BookingNoticeToast } from "./booking/BookingNoticeToast";
import { BookingSummaryCard } from "./booking/BookingSummaryCard";
import { buildNightlyBreakdown, calculateNights, formatLocalISO, type Notice } from "./booking/utils";
import {
  loadBookingInitData,
  loadUnavailableDates,
  sendBookingRequestMail,
} from "./booking/services";

const MIN_NIGHTS = 2;

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export default function Booking() {
  const { language, locale, dateFnsLocale } = useLanguage();
  const t = useT() as TranslateFn;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>(t("booking.defaultPropertyName"));
  const [currency, setCurrency] = useState<string>("EUR");
  const [defaultRate, setDefaultRate] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);

  const [seasons, setSeasons] = useState<(Season & { id: string })[]>([]);
  const [taxBands, setTaxBands] = useState<(TouristTaxBand & { id: string })[]>([]);

  const today = new Date();
  const plus3 = new Date(today.getTime() + 3 * 86400000);

  const [range, setRange] = useState<DateRange | undefined>({ from: today, to: plus3 });
  const [start, setStart] = useState<string>(formatLocalISO(today));
  const [end, setEnd] = useState<string>(formatLocalISO(plus3));

  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  const [blocked, setBlocked] = useState<Date[]>([]);
  const [avail, setAvail] = useState<"idle" | "checking" | "available" | "unavailable">("idle");

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [street, setStreet] = useState<string>("");
  const [zip, setZip] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>(language === "de" ? "Deutschland" : "Germany");

  const [submitting, setSubmitting] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  function flash(nextNotice: Notice) {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    setNotice(nextNotice);
    toastTimer.current = window.setTimeout(() => setNotice(null), 8000);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const initData = await loadBookingInitData(t("booking.defaultPropertyName"));
        setPropertyId(initData.propertyId);
        setPropertyName(initData.propertyName);
        setCurrency(initData.currency);
        setDefaultRate(initData.defaultRate);
        setCleaningFee(initData.cleaningFee);
        setSeasons(initData.seasons);
        setTaxBands(initData.taxBands);
      } catch (loadError) {
        const fallback = loadError instanceof Error ? loadError.message : "booking.loadError";
        setError(t(fallback));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  useEffect(() => {
    if (range?.from) {
      setStart(formatLocalISO(range.from));
    }
    if (range?.to) {
      setEnd(formatLocalISO(range.to));
    }
  }, [range]);

  useEffect(() => {
    (async () => {
      if (!propertyId) return;
      try {
        const unavailable = await loadUnavailableDates(propertyId);
        setBlocked(unavailable);
      } catch {
        setBlocked([]);
      }
    })();
  }, [propertyId]);

  useEffect(() => {
    setCountry((previous) => {
      const trimmed = previous.trim();
      if (trimmed === "" || trimmed === "Deutschland" || trimmed === "Germany") {
        return language === "de" ? "Deutschland" : "Germany";
      }
      return previous;
    });
  }, [language]);

  const fmt = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency }),
    [currency, locale],
  );

  const calc = useMemo(() => {
    try {
      if (!propertyId) return null;

      const property: Property = {
        id: propertyId,
        name: propertyName,
        slug: "",
        address: {},
        maxGuests: 6,
        checkInHour: 15,
        checkOutHour: 10,
        currency,
        defaultNightlyRate: defaultRate,
        cleaningFee,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
        description: "",
      };

      const base = priceForStay(property, seasons, start, end);
      const tax = touristTaxForStay(taxBands, start, end, adults);
      return { base, tax, grandTotal: base.total + tax.total };
    } catch {
      return null;
    }
  }, [propertyId, propertyName, currency, defaultRate, cleaningFee, seasons, taxBands, start, end, adults]);

  const nights = useMemo(() => calculateNights(start, end), [start, end]);

  useEffect(() => {
    let alive = true;

    async function checkAvailability() {
      if (!propertyId || nights <= 0 || nights < MIN_NIGHTS) {
        setAvail("idle");
        return;
      }

      setAvail("checking");
      try {
        const available = await isRangeAvailable(propertyId, start, end);
        if (!alive) return;
        setAvail(available ? "available" : "unavailable");
      } catch {
        if (!alive) return;
        setAvail("unavailable");
      }
    }

    const timeoutId = setTimeout(checkAvailability, 300);
    return () => {
      alive = false;
      clearTimeout(timeoutId);
    };
  }, [propertyId, start, end, nights]);

  const nightlyBreakdown = useMemo(() => {
    if (!propertyId) return [];
    return buildNightlyBreakdown({
      start,
      end,
      seasons,
      defaultRate,
      adults,
      getTaxForNight: (nightStart, nightEnd, countAdults) =>
        touristTaxForStay(taxBands, nightStart, nightEnd, countAdults).total,
      fallbackRateLabel: t("booking.rateLabelStandard"),
    });
  }, [propertyId, start, end, seasons, defaultRate, taxBands, adults, t]);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!propertyId || !calc) {
      flash({ type: "error", text: t("booking.invalidRange") });
      return;
    }

    if (avail !== "available") {
      flash({ type: "error", text: t("booking.rangeUnavailable") });
      return;
    }

    if (!name.trim() || !email.trim()) {
      flash({ type: "error", text: t("booking.requiredNameEmail") });
      return;
    }

    if (!street.trim() || !zip.trim() || !city.trim()) {
      flash({ type: "error", text: t("booking.requiredAddress") });
      return;
    }

    setSubmitting(true);
    try {
      const normalized = {
        startDate: start,
        endDate: end,
        adults: Number(adults),
        children: Number(children),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        address: {
          street: street.trim(),
          zip: zip.trim(),
          city: city.trim(),
          country: country.trim(),
        },
      };

      if (!normalized.email) {
        flash({ type: "error", text: t("booking.requiredValidEmail") });
        return;
      }

      await createBookingRequest({
        propertyId,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        adults: normalized.adults,
        children: normalized.children,
        status: "requested",
        contact: {
          name: normalized.name,
          email: normalized.email,
          phone: normalized.phone,
          language,
          address: normalized.address,
        },
        message: normalized.message,
        summary: {
          nights,
          nightlyTotal: calc.base.nightsTotal,
          cleaningFee: calc.base.cleaningFee,
          touristTax: calc.tax.total,
          grandTotal: calc.grandTotal,
          currency,
        },
      });

      const mailResult = await sendBookingRequestMail({
        propertyId,
        propertyName,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        adults: normalized.adults,
        children: normalized.children,
        contact: {
          name: normalized.name,
          email: normalized.email,
          phone: normalized.phone,
          language,
          address: normalized.address,
        },
        message: normalized.message,
        language,
      });

      if (mailResult.sent) {
        flash({ type: "success", text: t("booking.submitSuccess") });
      } else {
        flash({
          type: "error",
          text: t("booking.submitMailFailed", { reason: mailResult.reason || "" }),
        });
      }
    } catch (submitError) {
      flash({
        type: "error",
        text: submitError instanceof Error ? submitError.message : t("booking.submitError"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("booking.heading", { propertyName })}
        </h1>
        <p className="mt-2 text-slate-600">{t("booking.subheading")}</p>
      </header>

      <form id="booking-form" className="grid gap-4" onSubmit={submitRequest}>
        <Field label={t("booking.fieldDateRange")}>
          <DayPicker
            mode="range"
            locale={dateFnsLocale}
            numberOfMonths={2}
            fromDate={new Date()}
            selected={range}
            onSelect={setRange}
            disabled={[{ before: new Date() }, ...blocked]}
          />
        </Field>

        <Field label={t("booking.fieldAdults")}>
          <input
            className="input"
            type="number"
            min={0}
            value={adults}
            onChange={(event) => setAdults(Number(event.target.value))}
          />
        </Field>

        <Field label={t("booking.fieldChildren")}>
          <input
            className="input"
            type="number"
            min={0}
            value={children}
            onChange={(event) => setChildren(Number(event.target.value))}
          />
        </Field>

        <BookingContactFields
          t={(key) => t(key)}
          values={{ name, email, phone, message, street, zip, city, country }}
          setters={{ setName, setEmail, setPhone, setMessage, setStreet, setZip, setCity, setCountry }}
        />

        <BookingSummaryCard
          loading={loading}
          error={error}
          nights={nights}
          calc={calc}
          nightlyBreakdown={nightlyBreakdown}
          locale={locale}
          fmt={fmt}
          t={t}
        />

        <BookingAvailabilityInfo
          availability={avail}
          nights={nights}
          minNights={MIN_NIGHTS}
          t={t}
        />

        <button
          type="submit"
          className="rounded-xl bg-[color:var(--ocean,#0e7490)] px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          disabled={!calc || nights <= 0 || nights < MIN_NIGHTS || submitting}
        >
          {submitting ? t("booking.submitSending") : t("booking.submit")}
        </button>
      </form>

      <BookingNoticeToast
        notice={notice}
        onClose={() => setNotice(null)}
        closeLabel={t("booking.closeNotice")}
      />
    </section>
  );
}
