import englishUi from "@/i18n/locales/en/ui.json";

type Primitive = string | number;
type LocaleTree = Record<string, unknown>;

const locales: Record<string, LocaleTree> = {
  en: englishUi as LocaleTree,
};

const DEFAULT_LOCALE = "en";
let activeLocale = DEFAULT_LOCALE;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getByPath = (tree: LocaleTree, path: string): unknown => {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, tree);
};

const interpolate = (template: string, params?: Record<string, Primitive>): string => {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? "" : String(value);
  });
};

const normalizeMissingKey = (key: string): string => {
  const tail = key.split(".").pop() ?? key;
  return tail
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim() || key;
};

const resolveTemplate = (key: string): string | undefined => {
  const active = locales[activeLocale];
  const english = locales[DEFAULT_LOCALE];

  const inActive = active ? getByPath(active, key) : undefined;
  if (typeof inActive === "string") return inActive;

  const inEnglish = english ? getByPath(english, key) : undefined;
  if (typeof inEnglish === "string") return inEnglish;

  return undefined;
};

export const setLocale = (nextLocale: string): void => {
  activeLocale = nextLocale;
};

export const t = (key: string, params?: Record<string, Primitive>): string => {
  const template = resolveTemplate(key);
  if (!template) return normalizeMissingKey(key);
  return interpolate(template, params);
};
