import { useSyncExternalStore } from "react";
import englishUi from "@/i18n/locales/en/ui.json";
import ukrainianUi from "@/i18n/locales/uk/ui.json";
import englishColors from "@/i18n/locales/en/colors.json";
import ukrainianColors from "@/i18n/locales/uk/colors.json";

type Primitive = string | number;
type LocaleTree = Record<string, unknown>;
type LocaleCode = "en" | "uk";

const DEFAULT_LOCALE: LocaleCode = "en";
const LOCALE_STORAGE_KEY = "ficsit-locale";

const uiLocales: Record<LocaleCode, LocaleTree> = {
  en: englishUi as LocaleTree,
  uk: ukrainianUi as LocaleTree,
};

const colorLocales: Record<LocaleCode, LocaleTree> = {
  en: englishColors as LocaleTree,
  uk: ukrainianColors as LocaleTree,
};

const localeSubscribers = new Set<() => void>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getByPath = (tree: LocaleTree, path: string): unknown => {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, tree);
};

const normalizeMissingKey = (key: string): string => {
  const tail = key.split(".").pop() ?? key;
  return tail
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim() || key;
};

const normalizeLocaleCode = (nextLocale: string): LocaleCode => {
  const normalized = nextLocale.trim().toLowerCase();
  if (normalized === "uk" || normalized === "ua") {
    return "uk";
  }
  return "en";
};

const persistLocale = (localeCode: LocaleCode): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, localeCode);
  } catch {
    // Ignore storage write failures.
  }
};

const readStoredLocale = (): LocaleCode => {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!stored) return DEFAULT_LOCALE;
    return normalizeLocaleCode(stored);
  } catch {
    return DEFAULT_LOCALE;
  }
};

let activeLocale: LocaleCode = readStoredLocale();

const notifyLocaleSubscribers = (): void => {
  localeSubscribers.forEach((subscriber) => subscriber());
};

const resolveUiTemplate = (key: string): string | undefined => {
  const active = uiLocales[activeLocale];
  const english = uiLocales[DEFAULT_LOCALE];

  const inActive = active ? getByPath(active, key) : undefined;
  if (typeof inActive === "string") return inActive;

  const inEnglish = english ? getByPath(english, key) : undefined;
  if (typeof inEnglish === "string") return inEnglish;

  return undefined;
};

const getColorLocaleValue = (
  section: "colors" | "categories",
  key: string,
): string | undefined => {
  const active = colorLocales[activeLocale];
  const english = colorLocales[DEFAULT_LOCALE];

  const inActive = active ? getByPath(active, `${section}.${key}`) : undefined;
  if (typeof inActive === "string") return inActive;

  const inEnglish = english ? getByPath(english, `${section}.${key}`) : undefined;
  if (typeof inEnglish === "string") return inEnglish;

  return undefined;
};

const interpolate = (template: string, params?: Record<string, Primitive>): string => {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? "" : String(value);
  });
};

export const getLocale = (): LocaleCode => activeLocale;

export const subscribeLocaleChange = (listener: () => void): (() => void) => {
  localeSubscribers.add(listener);
  return () => {
    localeSubscribers.delete(listener);
  };
};

export const useLocale = (): LocaleCode =>
  useSyncExternalStore(subscribeLocaleChange, getLocale, () => DEFAULT_LOCALE);

export const setLocale = (nextLocale: string): void => {
  const normalized = normalizeLocaleCode(nextLocale);
  persistLocale(normalized);

  if (normalized === activeLocale) {
    return;
  }

  activeLocale = normalized;
  notifyLocaleSubscribers();
};

export const t = (key: string, params?: Record<string, Primitive>): string => {
  const template = resolveUiTemplate(key);
  if (!template) return normalizeMissingKey(key);
  return interpolate(template, params);
};

export const getColorName = (colorCode: string, fallbackName: string): string =>
  getColorLocaleValue("colors", colorCode) ?? fallbackName;

export const getCategoryName = (categoryCode: string): string =>
  getColorLocaleValue("categories", categoryCode) ?? categoryCode;
