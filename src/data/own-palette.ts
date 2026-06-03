import {
  colorPalettes,
  importColorsFile,
  type CategoryCode,
  type ColorCode,
  type ColorFileEntry,
  type ColorsFile,
  type SatisfactoryColorRecord,
  type SatisfactoryPalette,
} from "@/data/colors";

const OWN_PALETTE_CODE = "ownPalette";
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isHexColor = (value: string): boolean => HEX_COLOR_REGEX.test(value);

const normalizeCode = (value: string): string => value.trim().toUpperCase();

const defaultPaletteSnapshot = colorPalettes.default;
const knownOwnColorRecords = defaultPaletteSnapshot.colorRecords;
const knownOwnColorByCode = new Map<string, SatisfactoryColorRecord>(
  knownOwnColorRecords.map((record) => [record.code, record]),
);

let ownDraftRowCounter = 0;
const nextOwnDraftRowId = (): string => {
  ownDraftRowCounter += 1;
  return `own-row-${ownDraftRowCounter}`;
};

export interface OwnPaletteDraftRow {
  id: string;
  selectedCode: ColorCode | null;
  defaultName: string;
  hex: string;
  secondaryColor: string;
}

export interface OwnPaletteKnownCodeOption {
  code: ColorCode;
  defaultName: string;
}

export interface OwnPaletteDraftValidationResult {
  errors: string[];
  normalizedFile: ColorsFile | null;
}

export interface OwnPaletteDraftImportResult {
  errors: string[];
  rows: OwnPaletteDraftRow[] | null;
}

export interface OwnPaletteDraftBuildResult {
  errors: string[];
  normalizedFile: ColorsFile | null;
  palette: SatisfactoryPalette | null;
}

const categoryOther: CategoryCode = "CATEGORY_OTHER";

const decodeBase64Utf8 = (base64: string): string => {
  const rawBase64 = base64.trim();
  if (!rawBase64) {
    throw new Error("Import string is empty.");
  }

  const decodeBinary = (): string => {
    if (typeof atob === "function") {
      return atob(rawBase64);
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(rawBase64, "base64").toString("binary");
    }
    throw new Error("Base64 decoding is unavailable in this environment.");
  };

  const binary = decodeBinary();
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const encodeBase64Utf8 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  if (typeof btoa === "function") {
    return btoa(binary);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }
  throw new Error("Base64 encoding is unavailable in this environment.");
};

const rowLabel = (index: number): string => `Row ${index + 1}`;

const toOwnPaletteFileFromPalette = (palette: SatisfactoryPalette): ColorsFile => ({
  schemaVersion: 1,
  paletteCode: OWN_PALETTE_CODE,
  colors: palette.colorRecords.map((record) => ({
    code: record.code,
    defaultName: record.defaultName,
    hex: record.hex,
    secondaryColor: record.secondaryColor,
    categories: [...record.categories],
  })),
});

export const getOwnPaletteCode = (): string => OWN_PALETTE_CODE;

export const getOwnPaletteKnownCodeOptions = (): OwnPaletteKnownCodeOption[] =>
  knownOwnColorRecords.map((record) => ({
    code: record.code,
    defaultName: record.defaultName,
  }));

export const getOwnPaletteKnownRecord = (
  code: string,
): SatisfactoryColorRecord | undefined => knownOwnColorByCode.get(code);

export const createDefaultOwnPalette = (): SatisfactoryPalette => {
  const defaultPalette = colorPalettes.default;
  const defaultAsOwnFile: ColorsFile = {
    schemaVersion: 1,
    paletteCode: OWN_PALETTE_CODE,
    colors: defaultPalette.colorRecords.map((record) => ({
      code: record.code,
      defaultName: record.defaultName,
      hex: record.hex,
      secondaryColor: record.secondaryColor,
      categories: [...record.categories],
    })),
  };

  return importColorsFile(defaultAsOwnFile);
};

export const createEmptyOwnPaletteDraftRow = (): OwnPaletteDraftRow => ({
  id: nextOwnDraftRowId(),
  selectedCode: null,
  defaultName: "",
  hex: "",
  secondaryColor: "",
});

export const createOwnPaletteDraftRowsFromPalette = (
  palette: SatisfactoryPalette,
): OwnPaletteDraftRow[] =>
  palette.colorRecords.map((record) => ({
    id: nextOwnDraftRowId(),
    selectedCode: knownOwnColorByCode.has(record.code) ? record.code : null,
    defaultName: record.defaultName,
    hex: record.hex,
    secondaryColor: record.secondaryColor,
  }));

const normalizeSecondaryColor = (
  primaryHex: string,
  rawSecondary: string,
): { value: string; isProvided: boolean } => {
  const trimmedSecondary = rawSecondary.trim();
  if (!trimmedSecondary) {
    return {
      value: primaryHex,
      isProvided: false,
    };
  }

  return {
    value: trimmedSecondary,
    isProvided: true,
  };
};

const normalizeKnownCode = (
  rawCode: string | null,
): { normalizedCode: ColorCode | null; knownRecord: SatisfactoryColorRecord | null } => {
  if (!rawCode) {
    return { normalizedCode: null, knownRecord: null };
  }

  const normalized = normalizeCode(rawCode);
  const knownRecord = knownOwnColorByCode.get(normalized) ?? null;
  if (!knownRecord) {
    return { normalizedCode: null, knownRecord: null };
  }

  return {
    normalizedCode: knownRecord.code,
    knownRecord,
  };
};

export const validateAndNormalizeOwnPaletteDraft = (
  rows: OwnPaletteDraftRow[],
): OwnPaletteDraftValidationResult => {
  const errors: string[] = [];
  const seenCodes = new Set<string>();
  const colors: ColorFileEntry[] = [];

  rows.forEach((row, index) => {
    const label = rowLabel(index);
    const { normalizedCode, knownRecord } = normalizeKnownCode(row.selectedCode);

    if (normalizedCode) {
      if (seenCodes.has(normalizedCode)) {
        errors.push(`${label}: duplicate code "${normalizedCode}".`);
      } else {
        seenCodes.add(normalizedCode);
      }
    }

    const hex = row.hex.trim();
    if (!isHexColor(hex)) {
      errors.push(`${label}: invalid primary color format. Expected #RGB or #RRGGBB.`);
      return;
    }

    const normalizedSecondary = normalizeSecondaryColor(hex, row.secondaryColor);
    if (!isHexColor(normalizedSecondary.value)) {
      errors.push(`${label}: invalid secondary color format. Expected #RGB or #RRGGBB.`);
      return;
    }

    const fallbackKnownName = knownRecord?.defaultName ?? "";
    const defaultName = row.defaultName.trim() || fallbackKnownName;

    if (!normalizedCode && defaultName.length === 0) {
      errors.push(`${label}: defaultName is required when no known code is selected.`);
      return;
    }

    const categories = normalizedCode
      ? [...(knownRecord?.categories ?? [categoryOther])]
      : [categoryOther];

    colors.push({
      ...(normalizedCode ? { code: normalizedCode } : {}),
      defaultName,
      hex,
      secondaryColor: normalizedSecondary.value,
      categories,
    });
  });

  if (errors.length > 0) {
    return {
      errors,
      normalizedFile: null,
    };
  }

  return {
    errors: [],
    normalizedFile: {
      schemaVersion: 1,
      paletteCode: OWN_PALETTE_CODE,
      colors,
    },
  };
};

export const buildOwnPaletteFromDraftRows = (
  rows: OwnPaletteDraftRow[],
): OwnPaletteDraftBuildResult => {
  const normalized = validateAndNormalizeOwnPaletteDraft(rows);
  if (!normalized.normalizedFile) {
    return {
      errors: normalized.errors,
      normalizedFile: null,
      palette: null,
    };
  }

  try {
    const palette = importColorsFile(normalized.normalizedFile);
    return {
      errors: [],
      normalizedFile: normalized.normalizedFile,
      palette,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build own palette.";
    return {
      errors: [message],
      normalizedFile: null,
      palette: null,
    };
  }
};

const parseOwnPaletteObjectToDraftRows = (
  input: unknown,
): OwnPaletteDraftImportResult => {
  if (!isRecord(input)) {
    return { errors: ["Invalid object format."], rows: null };
  }

  const errors: string[] = [];

  if (input.schemaVersion !== 1) {
    errors.push("Invalid schemaVersion. Expected 1.");
  }

  if (typeof input.paletteCode !== "string" || input.paletteCode.trim().length === 0) {
    errors.push("Invalid paletteCode. Expected non-empty string.");
  }

  if (!Array.isArray(input.colors)) {
    errors.push("Invalid colors field. Expected array.");
    return { errors, rows: null };
  }

  const seenCodes = new Set<string>();

  const rows = input.colors.map<OwnPaletteDraftRow | null>((entry, index) => {
    const label = rowLabel(index);

    if (!isRecord(entry)) {
      errors.push(`${label}: invalid row format.`);
      return null;
    }

    const rawCode = entry.code;
    let normalizedCode: string | null = null;
    if (rawCode !== undefined && rawCode !== null) {
      if (typeof rawCode !== "string" || rawCode.trim().length === 0) {
        errors.push(`${label}: invalid code value.`);
      } else {
        normalizedCode = normalizeCode(rawCode);
        if (seenCodes.has(normalizedCode)) {
          errors.push(`${label}: duplicate code "${normalizedCode}".`);
        } else {
          seenCodes.add(normalizedCode);
        }
      }
    }

    const rawDefaultName = entry.defaultName;
    const defaultName =
      typeof rawDefaultName === "string" ? rawDefaultName.trim() : "";

    const rawHex = entry.hex;
    const hex = typeof rawHex === "string" ? rawHex.trim() : "";
    if (!isHexColor(hex)) {
      errors.push(`${label}: invalid primary color format. Expected #RGB or #RRGGBB.`);
    }

    const rawSecondary = entry.secondaryColor;
    const secondaryText = typeof rawSecondary === "string" ? rawSecondary : "";
    if (rawSecondary !== undefined && rawSecondary !== null && typeof rawSecondary !== "string") {
      errors.push(`${label}: invalid secondary color value.`);
    }

    const normalizedSecondary = normalizeSecondaryColor(hex, secondaryText);
    if (hex && !isHexColor(normalizedSecondary.value)) {
      errors.push(`${label}: invalid secondary color format. Expected #RGB or #RRGGBB.`);
    }

    const knownRecord = normalizedCode
      ? knownOwnColorByCode.get(normalizedCode) ?? null
      : null;
    const selectedCode = knownRecord?.code ?? null;
    const resolvedDefaultName = defaultName || knownRecord?.defaultName || "";

    if (!selectedCode && resolvedDefaultName.length === 0) {
      errors.push(`${label}: defaultName is required when no known code is selected.`);
    }

    return {
      id: nextOwnDraftRowId(),
      selectedCode,
      defaultName: resolvedDefaultName,
      hex,
      secondaryColor: normalizedSecondary.value,
    };
  });

  if (errors.length > 0) {
    return {
      errors,
      rows: null,
    };
  }

  return {
    errors: [],
    rows: rows.filter((row): row is OwnPaletteDraftRow => row !== null),
  };
};

export const importOwnPaletteObjectToDraftRows = (
  input: unknown,
): OwnPaletteDraftImportResult => parseOwnPaletteObjectToDraftRows(input);

export const importOwnPaletteBase64ToDraftRows = (
  rawInput: string,
): OwnPaletteDraftImportResult => {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      errors: ["Import string is empty."],
      rows: null,
    };
  }

  let decodedText: string;
  try {
    decodedText = decodeBase64Utf8(trimmed);
  } catch {
    return {
      errors: ["Malformed base64 string."],
      rows: null,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodedText) as unknown;
  } catch {
    return {
      errors: ["Decoded base64 is not valid JSON."],
      rows: null,
    };
  }

  return parseOwnPaletteObjectToDraftRows(parsed);
};

export const exportOwnPaletteFileToBase64 = (file: ColorsFile): string => {
  const payload: ColorsFile = {
    schemaVersion: 1,
    paletteCode: OWN_PALETTE_CODE,
    colors: file.colors.map((entry) => ({
      ...(entry.code ? { code: normalizeCode(entry.code) } : {}),
      defaultName: entry.defaultName,
      hex: entry.hex,
      secondaryColor: entry.secondaryColor,
      categories: [...entry.categories],
    })),
  };

  return encodeBase64Utf8(JSON.stringify(payload));
};

export const exportOwnPaletteToBase64 = (palette: SatisfactoryPalette): string =>
  exportOwnPaletteFileToBase64(toOwnPaletteFileFromPalette(palette));
