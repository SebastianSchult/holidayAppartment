import { useEffect, useId, useRef, useState } from "react";
import { buildGalleryImagePath, GALLERY_IMAGES } from "../lib/galleryImages";

export default function Gallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lightboxTitleId = useId();

  const closeLightbox = () => setActiveIndex(null);
  const showPrevious = () =>
    setActiveIndex((current) =>
      current === null
        ? current
        : (current - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length,
    );
  const showNext = () =>
    setActiveIndex((current) =>
      current === null ? current : (current + 1) % GALLERY_IMAGES.length,
    );

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        showPrevious();
      } else if (event.key === "ArrowRight") {
        showNext();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
          Galerie
        </h1>
        <p className="mt-1 text-slate-600">
          Klick auf ein Bild für die große Ansicht. Mit den Pfeiltasten kannst
          du durchblättern.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {GALLERY_IMAGES.map((fileName, index) => (
          <button
            key={fileName}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative z-0 overflow-hidden rounded-xl shadow-sm transition-transform duration-300 ease-out hover:z-20 hover:scale-[1.25] focus:outline-none focus-visible:z-20 focus-visible:scale-[1.25] focus-visible:ring-2 focus-visible:ring-[color:var(--ocean,#0e7490)]"
          >
            <img
              src={buildGalleryImagePath(fileName)}
              alt={`Ferienwohnung Ansicht ${index + 1}`}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 md:p-8"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-labelledby={lightboxTitleId}
        >
          <h2 id={lightboxTitleId} className="sr-only">Große Bildansicht</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeLightbox}
            className="absolute right-3 top-3 rounded-md bg-white/90 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white md:right-6 md:top-6"
          >
            Schließen
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md bg-white/90 px-3 py-2 text-2xl leading-none text-slate-900 hover:bg-white md:left-6"
            aria-label="Vorheriges Bild"
          >
            ‹
          </button>

          <figure
            className="max-h-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={buildGalleryImagePath(GALLERY_IMAGES[activeIndex])}
              alt={`Ferienwohnung Ansicht ${activeIndex + 1}`}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
              decoding="async"
            />
            <figcaption className="mt-3 text-center text-sm text-white/90">
              Bild {activeIndex + 1} von {GALLERY_IMAGES.length}
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/90 px-3 py-2 text-2xl leading-none text-slate-900 hover:bg-white md:right-6"
            aria-label="Nächstes Bild"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
