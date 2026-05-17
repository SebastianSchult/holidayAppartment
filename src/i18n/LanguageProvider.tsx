import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { de as dateFnsDe, enUS } from "date-fns/locale";
import { de, en, type Language } from "./translations";
import {
  LanguageContext,
  type LanguageContextValue,
  type TranslationParams,
} from "./context";

const STORAGE_KEY = "ferienwohnung.language";
const DEFAULT_LANGUAGE: Language = "de";

const dictionaries = {
  de,
  en,
};

function normalizeLanguage(input: unknown): Language {
  return input === "en" ? "en" : "de";
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return normalizeLanguage(stored);
  }

  return DEFAULT_LANGUAGE;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(normalizeLanguage(next));
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      const dict = dictionaries[language];
      const fallback = dictionaries.de;
      const entry = dict[key] ?? fallback[key];

      if (!entry) {
        return key;
      }

      if (typeof entry === "function") {
        return entry(params ?? {});
      }

      return interpolate(entry, params);
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      locale: language === "de" ? "de-DE" : "en-US",
      dateFnsLocale: language === "de" ? dateFnsDe : enUS,
      t,
    }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
