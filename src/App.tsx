import { NavBar } from "./components/NavBar";
import { AppRoutes } from "./app/routes";
import { useLocation } from "react-router-dom";
import { useT } from "./i18n/useLanguage";

export default function App() {
  const t = useT();
  const { pathname } = useLocation();
  const isBookingPage = pathname.startsWith("/book");

  return (
    <div className="min-h-screen bg-[color:var(--color-canvas)] text-[color:var(--color-ink)]">
      <NavBar />
      <main className="w-full px-6 py-8 pb-24 md:px-12 md:pb-8">
        <AppRoutes />
      </main>

      <footer className="hidden border-t border-[color:var(--color-hairline)] bg-white md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-[color:var(--color-muted)]">
          <div>© {new Date().getFullYear()} Antjes Ankerplatz</div>
          <nav className="space-x-4">
            <a href="/impressum" className="hover:underline">{t("app.footer.imprint")}</a>
            <a href="/datenschutz" className="hover:underline">{t("app.footer.privacy")}</a>
          </nav>
        </div>
      </footer>

      <footer className="fixed inset-x-0 bottom-0 z-40 block border-t border-[color:var(--color-hairline)] bg-white/95 p-3 backdrop-blur-sm md:hidden">
        {!isBookingPage && (
          <button
            onClick={() => location.assign("/book")}
            className="air-btn-primary w-full"
          >
            {t("app.footer.bookNow")}
          </button>
        )}
        <div className="mt-2 text-center text-xs text-[color:var(--color-muted)]">
          <a href="/impressum" className="mx-2 underline">{t("app.footer.imprint")}</a>
          <span aria-hidden>·</span>
          <a href="/datenschutz" className="mx-2 underline">{t("app.footer.privacy")}</a>
        </div>
      </footer>
    </div>
  );
}
