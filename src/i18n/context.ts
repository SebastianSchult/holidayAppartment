import { createContext } from "react";
import type { Locale } from "date-fns";
import type { Language } from "./translations";

export type TranslationParams = Record<string, string | number>;

export type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  locale: "de-DE" | "en-US";
  dateFnsLocale: Locale;
  t: (key: string, params?: TranslationParams) => string;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);
