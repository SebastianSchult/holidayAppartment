export const COOKIE_CONSENT_KEY = "aa_cookie_consent_v1";
export const COOKIE_CONSENT_UPDATED_EVENT = "aa:cookie-consent-updated";

export type CookieConsentCategory = "necessary" | "statistics" | "marketing";

export type CookieConsent = {
  version: 1;
  necessary: true;
  statistics: boolean;
  marketing: boolean;
  updatedAt: string;
};

function isValidConsent(input: unknown): input is CookieConsent {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as Partial<CookieConsent>;

  return (
    candidate.version === 1 &&
    candidate.necessary === true &&
    typeof candidate.statistics === "boolean" &&
    typeof candidate.marketing === "boolean" &&
    typeof candidate.updatedAt === "string"
  );
}

export function buildCookieConsent(options: {
  statistics: boolean;
  marketing: boolean;
}): CookieConsent {
  return {
    version: 1,
    necessary: true,
    statistics: options.statistics,
    marketing: options.marketing,
    updatedAt: new Date().toISOString(),
  };
}

export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isValidConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCookieConsent(consent: CookieConsent) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch {
    return;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: consent })
    );
  }
}

export function hasCookieConsent(
  category: CookieConsentCategory,
  consent: CookieConsent | null
): boolean {
  if (category === "necessary") {
    return true;
  }

  if (!consent) {
    return false;
  }

  if (category === "statistics") {
    return consent.statistics;
  }

  return consent.marketing;
}
