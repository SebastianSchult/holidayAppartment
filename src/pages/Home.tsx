import { useEffect, useMemo, useState } from "react";
import {
  buildGallerySrcSet,
  buildGalleryVariantPath,
  GALLERY_IMAGES,
} from "../lib/galleryImages";
import { useT } from "../i18n/useLanguage";
import { Seo } from "../components/Seo";

const SLIDESHOW_INTERVAL_MS = 9000;
const SLIDESHOW_TRANSITION_MS = 3200;

export default function Home() {
  const t = useT();
  const homeDescription = t("seo.homeDescription");
  const homeTitle = t("seo.homeTitle");
  const homeJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "VacationRental",
      name: "Antjes Ankerplatz",
      description: homeDescription,
      url: "/",
      image: [
        "/hero/cuxhaven-hero-640.jpg",
        "/hero/cuxhaven-hero-960.jpg",
        "/hero/cuxhaven-hero-1280.jpg",
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: "Spangerstr. 9",
        postalCode: "27476",
        addressLocality: "Cuxhaven",
        addressCountry: "DE",
      },
      telephone: "+49 4721 21508",
      email: "mutzi@antjes-ankerplatz.net",
      amenityFeature: [
        {
          "@type": "LocationFeatureSpecification",
          name: "Strandnah",
          value: true,
        },
        {
          "@type": "LocationFeatureSpecification",
          name: "Kostenloses Parken",
          value: true,
        },
        {
          "@type": "LocationFeatureSpecification",
          name: "Haustiere erlaubt",
          value: true,
        },
        {
          "@type": "LocationFeatureSpecification",
          name: "WLAN & Smart-TV",
          value: true,
        },
      ],
    }),
    [homeDescription],
  );
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
      <Seo
        title={homeTitle}
        description={homeDescription}
        image="/hero/cuxhaven-hero-1280.jpg"
        imageAlt={t("home.heroAlt")}
        jsonLd={homeJsonLd}
      />
      <div className="relative h-[52vh] w-full overflow-hidden rounded-[14px] md:h-[64vh]">
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
            alt={t("home.heroAlt")}
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
        <div className="air-card air-shadow-tier rounded-[14px] bg-white p-4 md:p-6">
          <h1 className="text-[28px] font-bold leading-[1.43] text-[color:var(--color-ink)]">
            {t("home.title")}
          </h1>
          <p className="mt-1 text-[color:var(--color-body)]">
            {t("home.subtitle")}
          </p>

          <form className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="md:col-span-1">
              <span className="mb-1 block text-sm text-[color:var(--color-muted)]">{t("home.arrival")}</span>
              <input
                className="input"
                type="date"
              />
            </label>
            <label className="md:col-span-1">
              <span className="mb-1 block text-sm text-[color:var(--color-muted)]">{t("home.departure")}</span>
              <input
                className="input"
                type="date"
              />
            </label>
            <label className="md:col-span-1">
              <span className="mb-1 block text-sm text-[color:var(--color-muted)]">{t("home.guests")}</span>
              <input
                className="input"
                type="number"
                min={1}
                defaultValue={2}
              />
            </label>
            <button
              className="air-btn-primary w-full"
              type="button"
              onClick={() => location.assign("/book")}
            >
              {t("home.checkAvailability")}
            </button>
          </form>
        </div>
      </div>

      <section className="mt-8 bg-[color:var(--color-surface-soft)] py-8 md:mt-12 md:py-12">
        <h2 className="sr-only">{t("home.featuresTitle")}</h2>
        <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-4">
          {[
            { t: t("home.featureBeach"), d: t("home.featureBeachDesc") },
            { t: t("home.featureParking"), d: t("home.featureParkingDesc") },
            { t: t("home.featurePets"), d: t("home.featurePetsDesc") },
            { t: t("home.featureWifi"), d: t("home.featureWifiDesc") },
          ].map((it) => (
            <article key={it.t} className="air-card rounded-[14px] bg-white p-4">
              <h3 className="text-base font-semibold text-[color:var(--color-ink)]">{it.t}</h3>
              <p className="text-sm text-[color:var(--color-muted)]">{it.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="air-card mb-6 rounded-[14px] bg-white p-5 md:p-6">
          <h2 className="text-[21px] font-bold leading-[1.43] text-[color:var(--color-ink)] md:text-[22px] md:font-medium md:leading-[1.18]">
            {t("home.descriptionTitle")}
          </h2>
          <p className="mt-2 text-[color:var(--color-body)]">
            {t("home.descriptionP1")}
          </p>
          <p className="mt-2 text-[color:var(--color-body)]">
            {t("home.descriptionP2")}
          </p>
        </div>

        <div className="mb-5">
          <h2 className="text-[21px] font-bold leading-[1.43] text-[color:var(--color-ink)] md:text-[22px] md:font-medium md:leading-[1.18]">
            {t("home.galleryTitle")}
          </h2>
          <p className="mt-1 text-[color:var(--color-muted)]">
            {t("home.galleryHint")}
          </p>
        </div>

        <div className="air-shadow-tier overflow-hidden rounded-[14px] bg-[color:var(--color-surface-soft)]">
          <div className="relative aspect-[16/9] w-full">
            <picture
              className={`absolute inset-0 ${slideMotionClass} ${
                isSliding ? "-translate-x-full" : "translate-x-0"
              }`}
              style={{ transitionDuration: `${SLIDESHOW_TRANSITION_MS}ms` }}
            >
              <img
                src={buildGalleryVariantPath(GALLERY_IMAGES[activeSlide], 1600)}
                srcSet={buildGallerySrcSet(GALLERY_IMAGES[activeSlide])}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                alt={t("home.galleryAlt", { index: activeSlide + 1 })}
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
              <img
                src={buildGalleryVariantPath(GALLERY_IMAGES[nextSlide], 1600)}
                srcSet={buildGallerySrcSet(GALLERY_IMAGES[nextSlide])}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                alt={t("home.galleryAlt", { index: nextSlide + 1 })}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {t("home.galleryCount", { current: activeSlide + 1, total: totalSlides })}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
