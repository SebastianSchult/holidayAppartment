import { Link, NavLink } from 'react-router-dom';

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-12">
        <div className="flex w-full flex-col gap-2 py-2 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
          <Link to="/" className="shrink-0 text-sm font-semibold leading-none sm:text-base">
            Antjes Ankerplatz
          </Link>
          <nav className="grid w-full grid-cols-3 gap-2 text-sm sm:w-auto sm:grid-cols-none sm:grid-flow-col sm:items-center">
            {[
              { to: "/gallery", label: "Galerie" },
              { to: "/prices", label: "Preise" },
              { to: "/book", label: "Buchen" },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center justify-center rounded-lg px-2.5 py-2 text-xs leading-none font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:px-4 sm:text-sm",
                    "text-slate-700 hover:text-slate-900",
                    "bg-white hover:bg-slate-50",
                    "shadow-sm hover:shadow-md",
                    "border border-slate-200 hover:border-slate-300",
                    "active:scale-[0.99]",
                    isActive &&
                      "!bg-[color:var(--ocean,#0e7490)] !text-white !border-transparent",
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
