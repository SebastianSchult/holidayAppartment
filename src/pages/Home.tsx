export default function Home() {
  return (
    <section className="relative w-full">
  <div className="relative h-[52vh] md:h-[64vh] w-full overflow-hidden">
    <img
      src="/hero/luftaufnahmeCuxhaven.png"
      alt="Meerblick"
      className="h-full w-full object-cover"
      loading="eager"
      decoding="async"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
  </div>

  <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
    <div className="rounded-2xl bg-white p-4 shadow-xl md:p-6">
      <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
        Ferienwohnung Antjes Ankerplatz
      </h1>
      <p className="mt-1 text-slate-600">
        Maritimer Komfort, 2000 m bis zur Nordsee – jetzt Verfügbarkeit prüfen.
      </p>

      <form className="mt-4 grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border p-3 md:col-span-1" type="date" aria-label="Anreise" />
        <input className="rounded-lg border p-3 md:col-span-1" type="date" aria-label="Abreise" />
        <input className="rounded-lg border p-3 md:col-span-1" type="number" min={1} defaultValue={2} aria-label="Gäste" />
        <button
          className="rounded-lg bg-[color:var(--ocean,#0e7490)] px-5 py-3 font-medium text-white hover:opacity-90"
          type="button"
          onClick={()=>location.assign('/book')}
        >
          Verfügbarkeit prüfen
        </button>
      </form>
    </div>
  </div>

  <section className="bg-[color:var(--sand,#f4ede4)] mt-8 md:mt-12 py-8 md:py-12">
  <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-4">
    {[
      { t:'Strandnah', d:'5 Minuten zu Fuß' },
      { t:'Kostenloses Parken', d:'Privatstellplatz' },
      { t:'Haustiere erlaubt', d:'auf Anfrage' },
      { t:'WLAN & Smart-TV', d:'inklusive' },
    ].map((it)=>(
      <div key={it.t} className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">{it.t}</h3>
        <p className="text-sm text-slate-600">{it.d}</p>
      </div>
    ))}
  </div>
</section>
</section>
  );
}