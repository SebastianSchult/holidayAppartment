import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../i18n/useLanguage";
import {
  buildCookieConsent,
  readCookieConsent,
  writeCookieConsent,
} from "../lib/cookieConsent";

export function CookieBanner() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [statisticsEnabled, setStatisticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const savedConsent = readCookieConsent();

    if (!savedConsent) {
      setVisible(true);
      return;
    }

    setStatisticsEnabled(savedConsent.statistics);
    setMarketingEnabled(savedConsent.marketing);
    setVisible(false);
  }, []);

  const saveConsent = (options: { statistics: boolean; marketing: boolean }) => {
    writeCookieConsent(buildCookieConsent(options));
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <aside
      className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-[color:var(--color-hairline)] bg-white p-4 shadow-xl md:inset-x-auto md:bottom-6 md:right-6 md:w-[min(560px,calc(100vw-3rem))]"
      role="dialog"
      aria-live="polite"
      aria-label={t("cookie.title")}
    >
      <h2 className="text-base font-semibold text-[color:var(--color-ink)]">{t("cookie.title")}</h2>
      <p className="mt-2 text-sm text-[color:var(--color-body)]">{t("cookie.description")}</p>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-[color:var(--color-hairline-soft)] bg-[color:var(--color-surface-soft)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-[color:var(--color-ink)]">{t("cookie.categoryNecessary.title")}</p>
            <span className="rounded-full bg-white px-2 py-1 text-xs text-[color:var(--color-muted)]">
              {t("cookie.alwaysActive")}
            </span>
          </div>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t("cookie.categoryNecessary.description")}</p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-[color:var(--color-hairline-soft)] p-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={statisticsEnabled}
            onChange={(event) => setStatisticsEnabled(event.target.checked)}
          />
          <span>
            <span className="block font-medium text-[color:var(--color-ink)]">{t("cookie.categoryStatistics.title")}</span>
            <span className="mt-1 block text-sm text-[color:var(--color-muted)]">{t("cookie.categoryStatistics.description")}</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-[color:var(--color-hairline-soft)] p-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={marketingEnabled}
            onChange={(event) => setMarketingEnabled(event.target.checked)}
          />
          <span>
            <span className="block font-medium text-[color:var(--color-ink)]">{t("cookie.categoryMarketing.title")}</span>
            <span className="mt-1 block text-sm text-[color:var(--color-muted)]">{t("cookie.categoryMarketing.description")}</span>
          </span>
        </label>
      </div>

      <p className="mt-3 text-sm text-[color:var(--color-muted)]">
        <Link className="underline" to="/datenschutz">
          {t("cookie.privacyLink")}
        </Link>
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="air-btn-secondary"
          onClick={() => saveConsent({ statistics: false, marketing: false })}
        >
          {t("cookie.essentialOnly")}
        </button>
        <button
          type="button"
          className="air-btn-secondary"
          onClick={() =>
            saveConsent({ statistics: statisticsEnabled, marketing: marketingEnabled })
          }
        >
          {t("cookie.saveSelection")}
        </button>
        <button
          type="button"
          className="air-btn-primary"
          onClick={() => saveConsent({ statistics: true, marketing: true })}
        >
          {t("cookie.acceptAll")}
        </button>
      </div>
    </aside>
  );
}
