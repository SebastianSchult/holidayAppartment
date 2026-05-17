import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";

const SITE_NAME = "Antjes Ankerplatz";

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export type SeoProps = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  jsonLd?: JsonLd;
};

function getOrigin() {
  const envBase = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (envBase) {
    return envBase.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "";
}

function toAbsoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const origin = getOrigin();
  if (!origin) {
    return path;
  }

  return new URL(path.startsWith("/") ? path : `/${path}`, origin).toString();
}

function ensureMeta(id: string, attrs: Record<string, string>) {
  const existing = document.getElementById(id) as HTMLMetaElement | null;
  const el = existing ?? document.createElement("meta");

  el.id = id;
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  if (!existing) {
    document.head.appendChild(el);
  }
}

function ensureLink(id: string, attrs: Record<string, string>) {
  const existing = document.getElementById(id) as HTMLLinkElement | null;
  const el = existing ?? document.createElement("link");

  el.id = id;
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  if (!existing) {
    document.head.appendChild(el);
  }
}

function ensureScript(id: string, jsonLd: JsonLd | undefined) {
  const existing = document.getElementById(id);

  if (!jsonLd) {
    existing?.remove();
    return;
  }

  const el = (existing as HTMLScriptElement | null) ?? document.createElement("script");
  el.id = id;
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(jsonLd);

  if (!existing) {
    document.head.appendChild(el);
  }
}

export function Seo({
  title,
  description,
  image,
  imageAlt,
  canonicalPath,
  noIndex = false,
  jsonLd,
}: SeoProps) {
  const { pathname } = useLocation();
  const { locale } = useLanguage();

  useEffect(() => {
    const canonicalUrl = toAbsoluteUrl(canonicalPath ?? pathname);
    const ogImage = image ? toAbsoluteUrl(image) : "";
    const robots = noIndex ? "noindex,nofollow" : "index,follow";
    const ogLocale = locale === "de-DE" ? "de_DE" : "en_US";

    document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    ensureMeta("seo-description", { name: "description", content: description });
    ensureMeta("seo-robots", { name: "robots", content: robots });
    ensureMeta("seo-og-title", { property: "og:title", content: title });
    ensureMeta("seo-og-description", { property: "og:description", content: description });
    ensureMeta("seo-og-type", { property: "og:type", content: "website" });
    ensureMeta("seo-og-url", { property: "og:url", content: canonicalUrl });
    ensureMeta("seo-og-site-name", { property: "og:site_name", content: SITE_NAME });
    ensureMeta("seo-og-locale", { property: "og:locale", content: ogLocale });
    ensureMeta("seo-twitter-card", {
      name: "twitter:card",
      content: ogImage ? "summary_large_image" : "summary",
    });
    ensureMeta("seo-twitter-title", { name: "twitter:title", content: title });
    ensureMeta("seo-twitter-description", { name: "twitter:description", content: description });

    if (ogImage) {
      ensureMeta("seo-og-image", { property: "og:image", content: ogImage });
      ensureMeta("seo-og-image-alt", {
        property: "og:image:alt",
        content: imageAlt ?? title,
      });
      ensureMeta("seo-twitter-image", { name: "twitter:image", content: ogImage });
    } else {
      document.getElementById("seo-og-image")?.remove();
      document.getElementById("seo-og-image-alt")?.remove();
      document.getElementById("seo-twitter-image")?.remove();
    }

    ensureLink("seo-canonical", {
      rel: "canonical",
      href: canonicalUrl,
    });

    ensureScript("seo-jsonld", jsonLd);
  }, [canonicalPath, description, image, imageAlt, jsonLd, locale, noIndex, pathname, title]);

  return null;
}
