import { useEffect, useState } from "react";
import {
  buildGalleryImagePath,
  buildGallerySrcSet,
  GALLERY_IMAGES,
} from "../lib/galleryImages";

const SLIDESHOW_INTERVAL_MS = 9000;
const SLIDESHOW_TRANSITION_MS = 3200;

export default function Home() {
  const totalSlides = GALLERY_IMAGES.length;
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const nextSlide = totalSlides > 0 ? (activeSlide + 1) % totalSlides : 0;
  const slideMotionClass = isSliding
    ? "transition-transform ease-linear"
    : "transition-none";

  useEffect(() => {
    if (totalSlides < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIsSliding(true);
    }, SLIDESHOW_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [totalSlides]);

  useEffect(() => {
    if (!isSliding || totalSlides < 2) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveSlide((previous) => (previous + 1) % totalSlides);
      setIsSliding(false);
    }, SLIDESHOW_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isSliding, totalSlides]);

  return (
    <section className="relative w-full">
      <div className="relative h-[52vh] w-full overflow-hidden md:h-[64vh]">
        <picture>
          <source
            type="image/avif"
            srcSet="/hero/cuxhaven-hero-640.avif 640w, /hero/cuxhaven-hero-960.avif 960w, /hero/cuxhaven-hero-1280.avif 1280w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/hero/cuxhaven-hero-640.webp 640w, /hero/cuxhaven-hero-960.webp 960w, /hero/cuxhaven-hero-1280.webp 1280w"
            sizes="100vw"
          />
          <img
            src="/hero/cuxhaven-hero-1280.jpg"
            srcSet="/hero/cuxhaven-hero-640.jpg 640w, /hero/cuxhaven-hero-960.jpg 960w, /hero/cuxhaven-hero-1280.jpg 1280w"
            sizes="100vw"
            alt="Meerblick"
            className="h-full w-full object-cover"
            width={1280}
            height={960}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
        <div className="rounded-2xl bg-white p-4 shadow-xl md:p-6">
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
            Ferienwohnung Antjes Ankerplatz
          </h1>
          <p className="mt-1 text-slate-600">
            Maritimer Komfort, 2000 m bis zur Nordsee – jetzt Verfügbarkeit
            prüfen.
          </p>

          <form className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="md:col-span-1">
              <span className="mb-1 block text-sm text-slate-700">Anreise</span>
              <input
                className="w-full rounded-lg border p-3"
                type="date"
              />
            </label>
            <label className="md:col-span-1">
              <span className="mb-1 block text-sm text-slate-700">Abreise</span>
              <input
                className="w-full rounded-lg border p-3"
                type="date"
              />
            </label>
            <label className="md:col-span-1">
              <span className="mb-1 block text-sm text-slate-700">Gäste</span>
              <input
                className="w-full rounded-lg border p-3"
                type="number"
                min={1}
                defaultValue={2}
              />
            </label>
            <button
              className="rounded-lg bg-[color:var(--ocean,#0e7490)] px-5 py-3 font-medium text-white hover:opacity-90"
              type="button"
              onClick={() => location.assign("/book")}
            >
              Verfügbarkeit prüfen
            </button>
          </form>
        </div>
      </div>

      <section className="mt-8 bg-[color:var(--sand,#f4ede4)] py-8 md:mt-12 md:py-12">
        <h2 className="sr-only">Ausstattungsmerkmale</h2>
        <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-4">
          {[
            { t: "Strandnah", d: "20 Minuten zu Fuß" },
            { t: "Kostenloses Parken", d: "Privatstellplatz" },
            { t: "Haustiere erlaubt", d: "auf Anfrage" },
            { t: "WLAN & Smart-TV", d: "inklusive" },
          ].map((it) => (
            <article key={it.t} className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{it.t}</h3>
              <p className="text-sm text-slate-600">{it.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Wohnungsbeschreibung
          </h2>
          <p className="mt-2 text-slate-700">
            Antjes Ankerplatz ist eine gemütliche, maritime Ferienwohnung für
            entspannte Tage an der Nordsee. Die Wohnung bietet einen hellen
            Wohnbereich, eine gut ausgestattete Küche und komfortable
            Schlafmöglichkeiten für Paare und Familien.
          </p>
          <p className="mt-2 text-slate-700">
            Dank der strandnahen Lage, eigenem Stellplatz und kurzer Wege zu
            Einkaufsmöglichkeiten ist sie ein idealer Ausgangspunkt für
            Erholung, Spaziergänge und Ausflüge rund um Cuxhaven.
          </p>
        </div>

        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Bildergalerie
          </h2>
          <p className="mt-1 text-slate-600">
            Die Bilder laufen automatisch von rechts nach links durch.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-lg">
          <div className="relative aspect-[16/9] w-full">
            <picture
              className={`absolute inset-0 ${slideMotionClass} ${
                isSliding ? "-translate-x-full" : "translate-x-0"
              }`}
              style={{ transitionDuration: `${SLIDESHOW_TRANSITION_MS}ms` }}
            >
              <source
                type="image/avif"
                srcSet={buildGallerySrcSet(GALLERY_IMAGES[activeSlide], "avif")}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
              />
              <source
                type="image/webp"
                srcSet={buildGallerySrcSet(GALLERY_IMAGES[activeSlide], "webp")}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
              />
              <img
                src={buildGalleryImagePath(GALLERY_IMAGES[activeSlide])}
                alt={`Ferienwohnung Ansicht ${activeSlide + 1}`}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </picture>
            <picture
              className={`absolute inset-0 ${slideMotionClass} ${
                isSliding ? "translate-x-0" : "translate-x-full"
              }`}
              style={{ transitionDuration: `${SLIDESHOW_TRANSITION_MS}ms` }}
            >
              <source
                type="image/avif"
                srcSet={buildGallerySrcSet(GALLERY_IMAGES[nextSlide], "avif")}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
              />
              <source
                type="image/webp"
                srcSet={buildGallerySrcSet(GALLERY_IMAGES[nextSlide], "webp")}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
              />
              <img
                src={buildGalleryImagePath(GALLERY_IMAGES[nextSlide])}
                alt={`Ferienwohnung Ansicht ${nextSlide + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              Bild {activeSlide + 1} von {totalSlides}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
