import colorsData from "@/data/colors.json";
import englishColorTranslations from "@/i18n/locales/en/colors.json";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const COLOR_CODE_PREFIX = "COLOR_";

export const knownCategoryCodes = [
  "CATEGORY_ALIENS",
  "CATEGORY_AMMOS",
  "CATEGORY_COMMUNICATIONS",
  "CATEGORY_CONSUMED",
  "CATEGORY_CONTAINERS",
  "CATEGORY_ELECTRONICS",
  "CATEGORY_FUELS",
  "CATEGORY_GAS",
  "CATEGORY_LIGHT_KELVIN_HEAT",
  "CATEGORY_LIGHT_FLUORESCENT",
  "CATEGORY_LIGHT_GASEOUS",
  "CATEGORY_ORES",
  "CATEGORY_INGOTS",
  "CATEGORY_MINERALS",
  "CATEGORY_LIQUIDS",
  "CATEGORY_INDUSTRIAL_PARTS",
  "CATEGORY_NUCLEAR",
  "CATEGORY_QUANTUM_TECHNOLOGY",
  "CATEGORY_STANDARD_PARTS",
  "CATEGORY_SPECIAL",
  "CATEGORY_WASTE",
  "CATEGORY_OTHER",
] as const;

const knownCategoryCodeSet = new Set<string>(knownCategoryCodes);

export type CategoryCode = (typeof knownCategoryCodes)[number];
export type ColorCode = `${typeof COLOR_CODE_PREFIX}${string}`;

export interface ColorFileEntry {
  code?: string;
  defaultName: string;
  hex: string;
  secondaryColor: string;
  categories: string[];
}

export interface ColorsFile {
  schemaVersion: number;
  paletteCode?: string;
  colors: ColorFileEntry[];
}

export interface SatisfactoryColorRecord {
  code: ColorCode;
  defaultName: string;
  hex: string;
  secondaryColor: string;
  categories: CategoryCode[];
}

export interface SatisfactoryColor {
  code: ColorCode;
  defaultName: string;
  name: string;
  hex: string;
  secondaryColor: string;
  categoryCodes: CategoryCode[];
  categories: string[];
}

export interface SatisfactoryPalette {
  id: string;
  categories: string[];
  categoryCodes: CategoryCode[];
  colors: SatisfactoryColor[];
  colorRecords: SatisfactoryColorRecord[];
}

export type Category = string;

const colorNameTranslations = (englishColorTranslations as { colors?: Record<string, string> }).colors ?? {};
const categoryNameTranslations = (englishColorTranslations as { categories?: Record<string, string> }).categories ?? {};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isKnownCategoryCode = (value: string): value is CategoryCode =>
  knownCategoryCodeSet.has(value);

const cleanCodePart = (input: string): string => {
  const cleaned = input
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase();

  return cleaned || "ITEM";
};

const generateColorCodeBase = (defaultName: string): ColorCode =>
  `${COLOR_CODE_PREFIX}${cleanCodePart(defaultName)}` as ColorCode;

const assertHexColor = (value: unknown, field: string, index: number): string => {
  if (typeof value !== "string" || !HEX_COLOR_REGEX.test(value)) {
    throw new Error(`Invalid ${field} at color index ${index}. Expected #RRGGBB.`);
  }
  return value;
};

const normalizeCategoryCodes = (rawCategories: unknown, index: number): CategoryCode[] => {
  if (!Array.isArray(rawCategories)) {
    throw new Error(`Invalid categories at color index ${index}. Expected string array.`);
  }

  const normalized = rawCategories
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map<CategoryCode>((categoryCode) => (isKnownCategoryCode(categoryCode) ? categoryCode : "CATEGORY_OTHER"));

  const unique = [...new Set<CategoryCode>(normalized)];
  return unique.length > 0 ? unique : ["CATEGORY_OTHER"];
};

const normalizeColorCode = (
  rawCode: unknown,
  defaultName: string,
  usedCodes: Set<string>,
): ColorCode => {
  if (typeof rawCode === "string" && rawCode.trim().length > 0) {
    const normalized = rawCode.trim().toUpperCase();
    if (usedCodes.has(normalized)) {
      throw new Error(`Duplicate color code provided: ${normalized}`);
    }
    usedCodes.add(normalized);
    return normalized as ColorCode;
  }

  const baseCode = generateColorCodeBase(defaultName);
  if (!usedCodes.has(baseCode)) {
    usedCodes.add(baseCode);
    return baseCode;
  }

  let suffix = 2;
  while (true) {
    const candidate = `${baseCode}_${suffix}`;
    if (!usedCodes.has(candidate)) {
      usedCodes.add(candidate);
      return candidate as ColorCode;
    }
    suffix += 1;
  }
};

const normalizeColorFileEntry = (
  entry: unknown,
  index: number,
  usedCodes: Set<string>,
): SatisfactoryColorRecord => {
  if (!isRecord(entry)) {
    throw new Error(`Invalid color entry at index ${index}. Expected object.`);
  }

  const defaultNameRaw = entry.defaultName;
  if (typeof defaultNameRaw !== "string" || defaultNameRaw.trim().length === 0) {
    throw new Error(`Invalid defaultName at color index ${index}.`);
  }

  const defaultName = defaultNameRaw.trim();
  const code = normalizeColorCode(entry.code, defaultName, usedCodes);
  const hex = assertHexColor(entry.hex, "hex", index);
  const secondaryColor = assertHexColor(entry.secondaryColor, "secondaryColor", index);
  const categories = normalizeCategoryCodes(entry.categories, index);

  return {
    code,
    defaultName,
    hex,
    secondaryColor,
    categories,
  };
};

const resolveColorName = (code: ColorCode, defaultName: string): string =>
  colorNameTranslations[code] ?? defaultName;

const resolveCategoryName = (code: CategoryCode): string =>
  categoryNameTranslations[code] ?? code;

const normalizeColorsFile = (input: unknown): { paletteCode: string; colors: SatisfactoryColorRecord[] } => {
  if (!isRecord(input)) {
    throw new Error("Invalid colors file. Expected object.");
  }

  if (typeof input.schemaVersion !== "number" || input.schemaVersion !== 1) {
    throw new Error("Invalid schemaVersion. Only schemaVersion=1 is supported.");
  }

  if (typeof input.paletteCode !== "string" || input.paletteCode.trim().length === 0) {
    throw new Error("Invalid paletteCode. Expected non-empty string.");
  }

  if (!Array.isArray(input.colors)) {
    throw new Error("Invalid colors field. Expected array.");
  }

  const usedCodes = new Set<string>();
  const colors = input.colors.map((entry, index) => normalizeColorFileEntry(entry, index, usedCodes));

  return {
    paletteCode: input.paletteCode.trim(),
    colors,
  };
};

const createPalette = (input: unknown): SatisfactoryPalette => {
  const normalized = normalizeColorsFile(input);

  const colorRecords = normalized.colors;
  const categoryCodes = knownCategoryCodes;
  const categories = categoryCodes.map(resolveCategoryName);

  const colors = colorRecords.map<SatisfactoryColor>((record) => ({
    code: record.code,
    defaultName: record.defaultName,
    name: resolveColorName(record.code, record.defaultName),
    hex: record.hex,
    secondaryColor: record.secondaryColor,
    categoryCodes: record.categories,
    categories: record.categories.map(resolveCategoryName),
  }));

  return {
    id: normalized.paletteCode,
    colors,
    categories,
    categoryCodes: [...categoryCodes],
    colorRecords,
  };
};

export const importColorsFile = (input: unknown): SatisfactoryPalette => createPalette(input);

export const exportColorsFile = (palette: SatisfactoryPalette): ColorsFile => ({
  schemaVersion: 1,
  paletteCode: palette.id,
  colors: palette.colorRecords.map((color) => ({
    code: color.code,
    defaultName: color.defaultName,
    hex: color.hex,
    secondaryColor: color.secondaryColor,
    categories: [...color.categories],
  })),
});

const defaultPalette = createPalette(colorsData);

export const colorPalettes = {
  default: defaultPalette,
} as const;

export type PaletteId = keyof typeof colorPalettes;

export const categories = colorPalettes.default.categories;
export const colors = colorPalettes.default.colors;
