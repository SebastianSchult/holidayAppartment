import { Link, NavLink } from 'react-router-dom';

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-8 md:px-12">
        <div className="flex h-14 w-full items-center justify-between">
        <Link to="/" className="font-semibold leading-none">Antjes Ankerplatz</Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
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
                  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm leading-none font-medium tracking-tight transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
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
