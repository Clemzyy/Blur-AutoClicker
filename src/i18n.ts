// i18n.ts
// Interface translations with a small React context. The English text is the
// key: t('Always on Top') returns the French text when there is one, and the
// English text otherwise, so a missing translation never breaks the UI.
// src/test/i18n.test.ts checks that every literal passed to t() is translated.
import {
  createContext,
  createElement,
  Fragment,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import fr from "./locales/fr.json";

export const LANGUAGE_SETTINGS = ["auto", "en", "fr"] as const;
export type LanguageSetting = (typeof LANGUAGE_SETTINGS)[number];
export type Language = Exclude<LanguageSetting, "auto">;

// Language names stay in their own language; only "System" is translated.
export const LANGUAGE_OPTIONS: readonly {
  value: LanguageSetting;
  label: string;
}[] = [
  { value: "auto", label: msg("System") },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

type TranslationVars = Record<string, string | number>;
export type Translate = (text: string, vars?: TranslationVars) => string;

const DICTIONARIES: Record<Language, Record<string, string>> = { en: {}, fr };

export function resolveLanguage(
  setting: LanguageSetting,
  systemLanguage: string = globalThis.navigator?.language ?? "en",
): Language {
  if (setting !== "auto") return setting;
  return systemLanguage.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    vars[key] === undefined ? match : String(vars[key]),
  );
}

export function translate(
  language: Language,
  text: string,
  vars?: TranslationVars,
): string {
  return interpolate(DICTIONARIES[language][text] ?? text, vars);
}

type I18nContextValue = { language: Language; t: Translate };

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  t: (text, vars) => interpolate(text, vars),
});

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  const t = useCallback<Translate>(
    (text, vars) => translate(language, text, vars),
    [language],
  );
  const value = useMemo(() => ({ language, t }), [language, t]);
  return createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}

// Fills {placeholders} of an already translated text with elements, for
// sentences with inline markup: the word order stays the translator's.
export function withElements(
  text: string,
  elements: Record<string, ReactNode>,
): ReactNode[] {
  return text.split(/(\{\w+\})/g).map((part, index) => {
    const name = part.match(/^\{(\w+)\}$/)?.[1];
    return name !== undefined && name in elements
      ? createElement(Fragment, { key: index }, elements[name])
      : part;
  });
}

// True when `count` takes the singular in `language` (French: 0 and 1).
export function isSingular(language: Language, count: number): boolean {
  return new Intl.PluralRules(language).select(count) === "one";
}

// Marks a text for translation where t() is not available (module-level
// constants); it is translated where it is displayed, with t(value).
export function msg(text: string): string {
  return text;
}

// Status texts sent by the Rust engine (stop reasons and warnings). They are
// only known at runtime, so they are listed here for the translation check.
export const BACKEND_MESSAGES = [
  "All click points completed",
  "Blocked by Alt+Tab",
  "Blocked by process list",
  "Bottom edge failsafe",
  "Bottom-left corner failsafe",
  "Bottom-right corner failsafe",
  "Custom stop zone failsafe",
  "Finish setting hotkey first",
  "Left edge failsafe",
  "Left start zone",
  "Right edge failsafe",
  "Stopped",
  "Stopped by master switch",
  "Stopped for hotkey input",
  "Stopped from hold hotkey",
  "Stopped from hotkey",
  "Stopped from toggle",
  "Top edge failsafe",
  "Top-left corner failsafe",
  "Top-right corner failsafe",
  "Update checks are disabled in development",
  "Whitelist mode has no entries selected",
] as const;

export function translateBackendMessage(
  message: string | null | undefined,
  t: Translate,
): string {
  if (!message) return "";
  const clickLimit = message.match(/^Click limit reached \((.+)\)$/);
  if (clickLimit) {
    return t("Click limit reached ({count})", { count: clickLimit[1] });
  }
  const timeLimit = message.match(/^Time limit reached \((.+)\)$/);
  if (timeLimit) {
    return t("Time limit reached ({time})", { time: timeLimit[1] });
  }
  return t(message);
}
