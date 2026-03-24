import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type JsonRecord = Record<string, unknown>;

interface InternalColorRow extends JsonRecord {
  defaultName: string;
  officialEnLocaleKey?: string | null;
}

interface InternalColorData extends JsonRecord {
  colors: InternalColorRow[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const internalColorsPath = path.resolve(
  projectRoot,
  "src",
  "data",
  "colors.json",
);

const findFirstExistingPath = (candidatePaths: string[]): string | null => {
  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
};

const officialEnLocalePath = findFirstExistingPath([
  path.resolve(projectRoot, "external-locale", "official", "en-us.json"),
  path.resolve(projectRoot, "external-source", "locale", "en-us.json"),
]);

if (!officialEnLocalePath) {
  throw new Error(
    "Could not find official en-us locale file. Tried: external-locale/official/en-us.json and external-source/locale/en-us.json",
  );
}

const readJson = <T>(filePath: string): T =>
  JSON.parse(readFileSync(filePath, "utf8")) as T;

const normalizeLocaleText = (value: string): string =>
  value
    .normalize("NFKC")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const flattenLocaleValues = (
  value: unknown,
  currentPath: string,
  output: Array<{ keyPath: string; value: string }>,
): void => {
  if (typeof value === "string") {
    output.push({ keyPath: currentPath, value });
    return;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return;
  }

  for (const [entryKey, entryValue] of Object.entries(value as JsonRecord)) {
    const nextPath = currentPath ? `${currentPath}.${entryKey}` : entryKey;
    flattenLocaleValues(entryValue, nextPath, output);
  }
};

const internalColorData = readJson<InternalColorData>(internalColorsPath);
const officialEnLocale = readJson<JsonRecord>(officialEnLocalePath);

const flattenedLocaleEntries: Array<{ keyPath: string; value: string }> = [];
flattenLocaleValues(officialEnLocale, "", flattenedLocaleEntries);

const localeValueToKey = new Map<string, string>();
const normalizedLocaleValueToKey = new Map<string, string>();

for (const entry of flattenedLocaleEntries) {
  if (!localeValueToKey.has(entry.value)) {
    localeValueToKey.set(entry.value, entry.keyPath);
  }

  const normalizedValue = normalizeLocaleText(entry.value);
  if (!normalizedLocaleValueToKey.has(normalizedValue)) {
    normalizedLocaleValueToKey.set(normalizedValue, entry.keyPath);
  }
}

const missingNames: string[] = [];
let matchedCount = 0;

internalColorData.colors = internalColorData.colors.map((colorRow) => {
  const exactMatch = localeValueToKey.get(colorRow.defaultName);
  const normalizedMatch = normalizedLocaleValueToKey.get(
    normalizeLocaleText(colorRow.defaultName),
  );
  const matchedKey = exactMatch ?? normalizedMatch ?? null;

  if (!matchedKey) {
    missingNames.push(colorRow.defaultName);
  } else {
    matchedCount += 1;
  }

  return {
    ...colorRow,
    officialEnLocaleKey: matchedKey,
  };
});

writeFileSync(internalColorsPath, JSON.stringify(internalColorData, null, 2));
console.log("Done. File successfully updated.");

if (missingNames.length > 0) {
  console.error("[localization-mapperfrom-en-us] Missing names:");
  for (const missingName of missingNames) {
    console.error(`- ${missingName}`);
  }
}
