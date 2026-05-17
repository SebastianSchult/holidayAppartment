import { SummaryItem } from "./BookingField";
import type { NightlyBreakdownRow } from "./utils";

type PriceSummary = {
  base: {
    nightsTotal: number;
    cleaningFee: number;
  };
  tax: {
    total: number;
  };
  grandTotal: number;
};

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function BookingSummaryCard({
  loading,
  error,
  nights,
  calc,
  nightlyBreakdown,
  locale,
  fmt,
  t,
}: {
  loading: boolean;
  error: string | null;
  nights: number;
  calc: PriceSummary | null;
  nightlyBreakdown: NightlyBreakdownRow[];
  locale: string;
  fmt: Intl.NumberFormat;
  t: TranslateFn;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {loading ? (
        <p className="text-slate-600">{t("booking.loading")}</p>
      ) : error ? (
        <p className="text-red-700">{error}</p>
      ) : nights <= 0 ? (
        <p className="text-slate-600">{t("booking.invalidNightCount")}</p>
      ) : calc ? (
        <div className="grid gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t("booking.summaryTitle")}</h2>
            <dl className="space-y-1">
              <SummaryItem label={t("booking.summaryNights")} value={String(nights)} />
              <SummaryItem label={t("booking.summaryStays")} value={fmt.format(calc.base.nightsTotal)} />
              <SummaryItem label={t("booking.summaryCleaning")} value={fmt.format(calc.base.cleaningFee)} />
              <SummaryItem label={t("booking.summaryTax")} value={fmt.format(calc.tax.total)} />
            </dl>
            <div className="mt-2 h-px bg-slate-200" />
            <dl>
              <SummaryItem label={t("booking.summaryTotal")} value={fmt.format(calc.grandTotal)} bold />
            </dl>
            <p className="mt-2 text-xs text-slate-500">{t("booking.summaryHint")}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">{t("booking.notesTitle")}</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              <li>{t("booking.noteEndExclusive")}</li>
              <li>{t("booking.noteSeasonRates")}</li>
              <li>{t("booking.noteTax")}</li>
            </ul>
          </div>

          <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 open:bg-white">
            <summary className="cursor-pointer select-none font-medium">
              {t("booking.nightlyDetails")}
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <caption className="sr-only">{t("booking.nightlyCaption")}</caption>
                <thead>
                  <tr className="text-left text-slate-600">
                    <th scope="col" className="py-1 pr-3">{t("booking.colDate")}</th>
                    <th scope="col" className="py-1 pr-3">{t("booking.colRateType")}</th>
                    <th scope="col" className="py-1 pr-3 text-right">{t("booking.colRatePerNight")}</th>
                    <th scope="col" className="py-1 pr-3 text-right">{t("booking.colTaxPerNight")}</th>
                    <th scope="col" className="py-1 pr-3 text-right">{t("booking.colTotalPerNight")}</th>
                  </tr>
                </thead>
                <tbody>
                  {nightlyBreakdown.map((night) => (
                    <tr key={night.date} className="border-t border-slate-200">
                      <td className="py-1 pr-3">
                        {new Date(`${night.date}T00:00:00`).toLocaleDateString(locale)}
                      </td>
                      <td className="py-1 pr-3">{night.label}</td>
                      <td className="py-1 pr-3 text-right">{fmt.format(night.rate)}</td>
                      <td className="py-1 pr-3 text-right">{fmt.format(night.tax)}</td>
                      <td className="py-1 pr-3 text-right">{fmt.format(night.subtotal)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-300 font-semibold">
                    <td className="py-1 pr-3" colSpan={4}>{t("booking.rowStayTotal")}</td>
                    <td className="py-1 pr-3 text-right">{fmt.format(calc.base.nightsTotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3" colSpan={4}>{t("booking.rowCleaning")}</td>
                    <td className="py-1 pr-3 text-right">{fmt.format(calc.base.cleaningFee)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3" colSpan={4}>{t("booking.rowTaxTotal")}</td>
                    <td className="py-1 pr-3 text-right">{fmt.format(calc.tax.total)}</td>
                  </tr>
                  <tr className="border-t-2 border-slate-300 font-semibold">
                    <td className="py-1 pr-3" colSpan={4}>{t("booking.rowGrandTotal")}</td>
                    <td className="py-1 pr-3 text-right">{fmt.format(calc.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      ) : (
        <p className="text-slate-600">{t("booking.priceCalcError")}</p>
      )}
    </div>
  );
}
