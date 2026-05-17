import { Link, NavLink } from "react-router-dom";
import { useLanguage, useT } from "../i18n/useLanguage";

export function NavBar() {
  const { language, setLanguage } = useLanguage();
  const t = useT();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-hairline)] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <div className="w-full py-2 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="air-focus-ring shrink-0 rounded-full px-2 py-1 text-sm font-semibold leading-none text-[color:var(--color-ink)] sm:text-base"
            >
              {t("nav.brand")}
            </Link>
            <div
              className="inline-flex items-center rounded-full border border-[color:var(--color-hairline)] bg-white p-1"
              role="group"
              aria-label={t("nav.languageLabel")}
            >
              <button
                type="button"
                className={[
                  "air-focus-ring rounded-full px-3 py-1 text-xs font-semibold transition",
                  language === "de"
                    ? "bg-[color:var(--color-primary)] text-white"
                    : "text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-soft)]",
                ].join(" ")}
                onClick={() => setLanguage("de")}
                aria-pressed={language === "de"}
              >
                {t("nav.languageDe")}
              </button>
              <button
                type="button"
                className={[
                  "air-focus-ring rounded-full px-3 py-1 text-xs font-semibold transition",
                  language === "en"
                    ? "bg-[color:var(--color-primary)] text-white"
                    : "text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-soft)]",
                ].join(" ")}
                onClick={() => setLanguage("en")}
                aria-pressed={language === "en"}
              >
                {t("nav.languageEn")}
              </button>
            </div>
          </div>
          <nav
            className="mt-2 grid w-full grid-cols-3 gap-2 text-sm sm:w-auto sm:grid-flow-col sm:justify-start sm:gap-2 sm:text-base"
            aria-label={t("nav.ariaMain")}
          >
            {[
              { to: "/gallery", label: t("nav.gallery") },
              { to: "/prices", label: t("nav.prices") },
              { to: "/book", label: t("nav.book") },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "air-focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-3 py-2 text-xs leading-none font-medium transition sm:px-4 sm:text-sm",
                    "border border-[color:var(--color-hairline)] bg-white text-[color:var(--color-ink)]",
                    "hover:air-shadow-tier",
                    isActive &&
                      "border-transparent bg-[color:var(--color-primary)] text-white",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
