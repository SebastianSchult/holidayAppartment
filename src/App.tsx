import { NavBar } from "./components/NavBar";
import { AppRoutes } from "./app/routes";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <NavBar />
      <main className="w-full px-6 md:px-12 py-8 pb-24 md:pb-8">
        <AppRoutes />
      </main>
      {/* Desktop/Tablet Footer */}
      <footer className="hidden md:block border-t border-slate-200/70 bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Antjes Ankerplatz</div>
          <nav className="space-x-4">
            <a href="/impressum" className="hover:underline">Impressum</a>
            <a href="/datenschutz" className="hover:underline">Datenschutz</a>
          </nav>
        </div>
      </footer>

      {/* Mobile Footer (fixed) */}
      <footer className="fixed inset-x-0 bottom-0 z-40 block bg-white/95 p-3 shadow md:hidden">
        <button
          onClick={() => location.assign("/book")}
          className="w-full rounded-xl bg-[color:var(--ocean,#0e7490)] py-3 text-center font-semibold text-white"
        >
          Jetzt buchen
        </button>
        <div className="mt-2 text-center text-xs text-slate-500">
          <a href="/impressum" className="mx-2 underline">Impressum</a>
          <span aria-hidden>·</span>
          <a href="/datenschutz" className="mx-2 underline">Datenschutz</a>
        </div>
      </footer>
    </div>
  );
}
