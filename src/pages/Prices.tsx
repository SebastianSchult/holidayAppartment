import { useEffect, useMemo, useState } from "react";
import { getFirstPropertyLite, getPropertyLite, listSeasonsLite } from "../lib/publicPricingData";
import { useLanguage, useT } from "../i18n/useLanguage";
import { Seo } from "../components/Seo";

type Row = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (exklusiv)
  nightlyRate: number;
  minNights?: number;
};

export default function Prices() {
  const { locale } = useLanguage();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>(t("prices.defaultPropertyName"));
  const [currency, setCurrency] = useState<string>("EUR");
  const [defaultNightlyRate, setDefaultNightlyRate] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const envId = (import.meta as unknown as { env: Record<string, string | undefined> }).env
          .VITE_DEFAULT_PROPERTY_ID
          ?.trim();

        let resolvedPropId: string | null = null;
        let resolvedProp: Awaited<ReturnType<typeof getPropertyLite>> = null;
        let seasonsData: Awaited<ReturnType<typeof listSeasonsLite>> = [];

        if (envId) {
          const [propResult, seasonsResult] = await Promise.allSettled([
            getPropertyLite(envId),
            listSeasonsLite(envId),
          ]);
          if (propResult.status === "fulfilled" && propResult.value) {
            resolvedPropId = envId;
            resolvedProp = propResult.value;
          }
          if (seasonsResult.status === "fulfilled") {
            seasonsData = seasonsResult.value;
          }
        }

        if (!resolvedProp || !resolvedPropId) {
          const first = await getFirstPropertyLite();
          if (!first?.data) {
            setRows([]);
            return;
          }
          resolvedPropId = first.id;
          resolvedProp = first.data;
          if (!envId || envId !== resolvedPropId) {
            seasonsData = await listSeasonsLite(resolvedPropId);
          }
        }

        setPropertyName(resolvedProp.name || t("prices.defaultPropertyName"));
        setCurrency(resolvedProp.currency || "EUR");
        setDefaultNightlyRate(resolvedProp.defaultNightlyRate || 0);
        setCleaningFee(resolvedProp.cleaningFee || 0);

        seasonsData.sort((a, b) => a.startDate.localeCompare(b.startDate));
        setRows(
          seasonsData.map((s) => ({
            id: s.id || `${s.propertyId}-${s.startDate}`,
            name: s.name,
            startDate: s.startDate,
            endDate: s.endDate,
            nightlyRate: s.nightlyRate,
            minNights: s.minNights,
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : t("prices.errorLoad"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency }),
    [currency, locale]
  );
  const fmtDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <section className="space-y-8">
      <Seo
        title={t("seo.pricesTitle", { propertyName })}
        description={t("seo.pricesDescription")}
        image="/hero/cuxhaven-hero-1280.jpg"
        imageAlt={t("home.heroAlt")}
      />
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{t("prices.title", { propertyName })}</h1>
        <p className="mt-2 text-slate-600">
          {t("prices.subtitle")}
        </p>
      </header>

      {/* Standardpreis & Endreinigung */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{t("prices.standardTitle")}</h2>
          <p className="mt-1 text-2xl font-bold">{formatter.format(defaultNightlyRate)} <span className="text-base font-normal text-slate-600">{t("prices.perNight")}</span></p>
          <p className="mt-2 text-sm text-slate-600">
            {t("prices.standardHint")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{t("prices.cleaningTitle")}</h2>
          <p className="mt-1 text-2xl font-bold">{formatter.format(cleaningFee)}</p>
          <p className="mt-2 text-sm text-slate-600">
            {t("prices.cleaningHint")}
          </p>
        </div>
      </div>

      {/* Saisonpreise */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{t("prices.seasonsTitle")}</h2>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-slate-600">{t("prices.loading")}</div>
        ) : error ? (
          <div className="px-4 py-6 text-red-700">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-slate-600">{t("prices.empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <caption className="sr-only">
                {t("prices.caption", { propertyName })}
              </caption>
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <Th>{t("prices.colRange")}</Th>
                  <Th>{t("prices.colName")}</Th>
                  <Th className="text-right">{t("prices.colRate")}</Th>
                  <Th className="text-right">{t("prices.colMinNights")}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <Td>
                      {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                      <span className="ml-1 text-xs text-slate-500">{t("prices.rangeEndExclusive")}</span>
                    </Td>
                    <Td>{r.name}</Td>
                    <Td className="text-right">{formatter.format(r.nightlyRate)}</Td>
                    <Td className="text-right">{r.minNights ?? "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-[color:var(--seafoam,#e0f2f1)] px-6 py-6 text-center md:py-8">
        <h3 className="text-xl font-semibold">{t("prices.ctaTitle")}</h3>
        <p className="mt-1 text-slate-700">
          {t("prices.ctaText")}
        </p>
        <a
          href="/book"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-[color:var(--ocean,#0e7490)] px-5 py-2 text-white hover:opacity-90"
        >
          {t("prices.ctaButton")}
        </a>
      </div>
    </section>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={["px-3 py-2 text-left font-medium", className].filter(Boolean).join(" ")}
    >
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={["px-3 py-2", className].filter(Boolean).join(" ")}>{children}</td>;
}
