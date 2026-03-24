import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type JsonRecord = Record<string, unknown>;

interface InternalColorRow {
  code: string;
  defaultName: string;
  categories: string[];
  officialEnLocaleKey?: string | null;
}

interface InternalColorData {
  colors: InternalColorRow[];
}

interface AppColorsLocaleFile {
  categories?: Record<string, string>;
  colors?: Record<string, string>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const internalColorsPath = path.resolve(projectRoot, "src", "data", "colors.json");
const localesRootPath = path.resolve(projectRoot, "src", "i18n", "locales");

const officialLocaleRootPathCandidates = [
  path.resolve(projectRoot, "external-locale", "official"),
  path.resolve(projectRoot, "external-source", "locale"),
];

const officialLocaleAliasMap: Record<string, string[]> = {
  en: ["en-us"],
  uk: ["uk-ua", "ua"],
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readJson = <T>(filePath: string): T =>
  JSON.parse(readFileSync(filePath, "utf8")) as T;

const readJsonIfExists = <T>(filePath: string): T | null => {
  if (!existsSync(filePath)) {
    return null;
  }
  return readJson<T>(filePath);
};

const writeJson = (filePath: string, payload: unknown): void => {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const humanizeCode = (code: string, prefix: string): string => {
  const trimmed = code.startsWith(prefix) ? code.slice(prefix.length) : code;
  return trimmed
    .toLowerCase()
    .split("_")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const findOfficialLocaleRootPath = (): string | null => {
  for (const candidatePath of officialLocaleRootPathCandidates) {
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
};

const resolveOfficialLocaleFilePath = (
  localeCode: string,
  officialLocaleRootPath: string | null,
): string | null => {
  if (!officialLocaleRootPath) {
    return null;
  }

  const fileNameToPath = new Map<string, string>();
  for (const entry of readdirSync(officialLocaleRootPath, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.toLowerCase().endsWith(".json")) {
      continue;
    }

    fileNameToPath.set(entry.name.toLowerCase(), path.resolve(officialLocaleRootPath, entry.name));
  }

  const candidates: string[] = [];
  candidates.push(localeCode);

  const aliases = officialLocaleAliasMap[localeCode] ?? [];
  for (const alias of aliases) {
    candidates.push(alias);
  }

  const localePrefixMatch = [...fileNameToPath.keys()].find((fileName) =>
    fileName.startsWith(`${localeCode.toLowerCase()}-`),
  );
  if (localePrefixMatch) {
    candidates.push(localePrefixMatch.replace(/\.json$/i, ""));
  }

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase().endsWith(".json")
      ? candidate.toLowerCase()
      : `${candidate.toLowerCase()}.json`;
    const resolvedPath = fileNameToPath.get(normalized);
    if (resolvedPath) {
      return resolvedPath;
    }
  }

  return null;
};

const getOfficialLocalizedValue = (
  officialLocale: JsonRecord,
  officialKeyPath: string,
): string | null => {
  const separatorIndex = officialKeyPath.indexOf(".");
  if (separatorIndex < 1) {
    return null;
  }

  const namespace = officialKeyPath.slice(0, separatorIndex);
  const itemKey = officialKeyPath.slice(separatorIndex + 1);

  const namespaceValue = officialLocale[namespace];
  if (!isRecord(namespaceValue)) {
    return null;
  }

  const localizedValue = namespaceValue[itemKey];
  return typeof localizedValue === "string" ? localizedValue : null;
};

const ensureLocaleFile = (
  localeDirectoryPath: string,
  localeDirectoryName: string,
  internalColorData: InternalColorData,
  englishTemplateLocale: AppColorsLocaleFile,
  officialLocaleRootPath: string | null,
): void => {
  const localeColorsPath = path.resolve(localeDirectoryPath, "colors.json");
  const existingLocaleData = readJsonIfExists<AppColorsLocaleFile>(localeColorsPath) ?? {};

  const officialLocaleFilePath = resolveOfficialLocaleFilePath(
    localeDirectoryName,
    officialLocaleRootPath,
  );
  const officialLocaleData = officialLocaleFilePath
    ? readJsonIfExists<JsonRecord>(officialLocaleFilePath)
    : null;

  const orderedCategoryCodes = [
    ...new Set(
      [
        ...Object.keys(englishTemplateLocale.categories ?? {}),
        ...internalColorData.colors.flatMap((row) => row.categories),
      ].filter((value) => value.trim().length > 0),
    ),
  ];

  const nextCategories: Record<string, string> = {};
  for (const categoryCode of orderedCategoryCodes) {
    const existingTranslation = existingLocaleData.categories?.[categoryCode];
    const englishTranslation = englishTemplateLocale.categories?.[categoryCode];
    nextCategories[categoryCode] =
      existingTranslation ?? englishTranslation ?? humanizeCode(categoryCode, "CATEGORY_");
  }

  const nextColors: Record<string, string> = {};

  let officialMatches = 0;
  let existingFallbacks = 0;
  let defaultFallbacks = 0;

  for (const colorRow of internalColorData.colors) {
    const officialKeyPath =
      typeof colorRow.officialEnLocaleKey === "string"
        ? colorRow.officialEnLocaleKey.trim()
        : "";

    const officialValue =
      officialLocaleData && officialKeyPath
        ? getOfficialLocalizedValue(officialLocaleData, officialKeyPath)
        : null;

    if (officialValue) {
      nextColors[colorRow.code] = officialValue;
      officialMatches += 1;
      continue;
    }

    const existingValue = existingLocaleData.colors?.[colorRow.code];
    if (existingValue) {
      nextColors[colorRow.code] = existingValue;
      existingFallbacks += 1;
      continue;
    }

    nextColors[colorRow.code] = colorRow.defaultName;
    defaultFallbacks += 1;
  }

  const payload: AppColorsLocaleFile = {
    categories: nextCategories,
    colors: nextColors,
  };

  mkdirSync(localeDirectoryPath, { recursive: true });
  writeJson(localeColorsPath, payload);

  const officialSource = officialLocaleFilePath ?? "none";
  console.error(
    `[localization-sync-locales] ${localeDirectoryName}: wrote ${localeColorsPath} | official source: ${officialSource} | official: ${officialMatches}, existing fallback: ${existingFallbacks}, default fallback: ${defaultFallbacks}`,
  );
};

const run = (): void => {
  const internalColorData = readJson<InternalColorData>(internalColorsPath);
  if (!Array.isArray(internalColorData.colors)) {
    throw new Error(`Invalid colors file: ${internalColorsPath}`);
  }

  const localeDirectories = readdirSync(localesRootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (localeDirectories.length === 0) {
    throw new Error(`No locale directories found in ${localesRootPath}`);
  }

  const englishTemplatePath = path.resolve(localesRootPath, "en", "colors.json");
  const englishTemplateLocale = readJsonIfExists<AppColorsLocaleFile>(englishTemplatePath) ?? {};
  const officialLocaleRootPath = findOfficialLocaleRootPath();

  for (const localeDirectoryName of localeDirectories) {
    const localeDirectoryPath = path.resolve(localesRootPath, localeDirectoryName);
    ensureLocaleFile(
      localeDirectoryPath,
      localeDirectoryName,
      internalColorData,
      englishTemplateLocale,
      officialLocaleRootPath,
    );
  }
};

run();
