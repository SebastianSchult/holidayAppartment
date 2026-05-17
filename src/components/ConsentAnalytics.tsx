import { useEffect } from "react";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  readCookieConsent,
} from "../lib/cookieConsent";
import type { CookieConsent } from "../lib/cookieConsent";

type GtagConsentState = "granted" | "denied";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
let initializedForMeasurementId: string | null = null;

function toState(allowed: boolean): GtagConsentState {
  return allowed ? "granted" : "denied";
}

function ensureGtagBase() {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
  }
}

function applyConsent(consent: CookieConsent | null) {
  ensureGtagBase();

  window.gtag("consent", "update", {
    analytics_storage: toState(Boolean(consent?.statistics)),
    ad_storage: toState(Boolean(consent?.marketing)),
    ad_user_data: toState(Boolean(consent?.marketing)),
    ad_personalization: toState(Boolean(consent?.marketing)),
  });
}

function loadGtagScript(measurementId: string) {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`
  );

  if (existing) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

function initializeGtag(measurementId: string) {
  if (initializedForMeasurementId === measurementId) {
    return;
  }

  ensureGtagBase();
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });
  initializedForMeasurementId = measurementId;
}

export function ConsentAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      return;
    }

    ensureGtagBase();

    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    const syncConsent = (consent: CookieConsent | null) => {
      applyConsent(consent);

      if (consent?.statistics) {
        loadGtagScript(GA_MEASUREMENT_ID);
        initializeGtag(GA_MEASUREMENT_ID);
      }
    };

    syncConsent(readCookieConsent());

    const onConsentChanged = (event: Event) => {
      const customEvent = event as CustomEvent<CookieConsent>;
      syncConsent(customEvent.detail ?? readCookieConsent());
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentChanged);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentChanged);
    };
  }, []);

  return null;
}
