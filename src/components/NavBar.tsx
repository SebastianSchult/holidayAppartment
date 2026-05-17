import { Link, NavLink } from "react-router-dom";

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-hairline)] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <div className="flex w-full flex-col gap-2 py-2 sm:h-20 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
          <Link
            to="/"
            className="air-focus-ring shrink-0 rounded-full px-2 py-1 text-sm font-semibold leading-none text-[color:var(--color-ink)] sm:text-base"
          >
            Antjes Ankerplatz
          </Link>
          <nav className="grid w-full grid-cols-3 gap-2 text-sm sm:w-auto sm:grid-cols-none sm:grid-flow-col sm:items-center" aria-label="Hauptnavigation">
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
