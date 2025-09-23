import { NavBar } from "./components/NavBar";
import { AppRoutes } from "./app/routes";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <NavBar />
      <main className="w-full px-6 md:px-12 py-8 pb-24 md:pb-8">
        <AppRoutes />
      </main>
      <footer className="fixed inset-x-0 bottom-0 z-40 block bg-white/95 p-3 shadow md:hidden">
        <button
          onClick={() => location.assign("/book")}
          className="w-full rounded-xl bg-[color:var(--ocean,#0e7490)] py-3 text-center font-semibold text-white"
        >
          Jetzt buchen
        </button>
      </footer>
    </div>
  );
}
