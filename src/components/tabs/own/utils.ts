import type { SatisfactoryPalette } from "@/data/colors";
import { getOwnPaletteKnownRecord, type OwnPaletteDraftRow } from "@/data/own-palette";
import type { OwnComparableDraftRow } from "./types";

export const OWN_CUSTOM_CODE_SENTINEL = "__OWN_CUSTOM_CODE__";

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NON_HEX_CHARACTERS_REGEX = /[^0-9a-fA-F]/g;
const HEX_INPUT_MAX_DIGITS = 6;

export const isHexColor = (value: string): boolean => HEX_COLOR_REGEX.test(value.trim());

export const maskHexColorInput = (rawValue: string): string => {
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const rawDigits = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  const digits = rawDigits
    .replace(NON_HEX_CHARACTERS_REGEX, "")
    .slice(0, HEX_INPUT_MAX_DIGITS);

  return `#${digits.toUpperCase()}`;
};

const toCanonicalComparableRow = (
  row: OwnComparableDraftRow,
): OwnComparableDraftRow => {
  const knownRecord = row.selectedCode
    ? getOwnPaletteKnownRecord(row.selectedCode)
    : null;

  const selectedCode = knownRecord?.code ?? null;
  const defaultName = row.defaultName.trim() || knownRecord?.defaultName || "";
  const hex = row.hex.trim();
  const secondaryRaw = row.secondaryColor.trim();
  const secondaryColor = secondaryRaw || hex;

  return {
    selectedCode,
    defaultName,
    hex,
    secondaryColor,
  };
};

export const toComparableDraftRow = (row: OwnPaletteDraftRow): OwnComparableDraftRow =>
  toCanonicalComparableRow({
    selectedCode: row.selectedCode,
    defaultName: row.defaultName,
    hex: row.hex,
    secondaryColor: row.secondaryColor,
  });

export const toComparableDraftRowsFromPalette = (
  palette: SatisfactoryPalette,
): OwnComparableDraftRow[] =>
  palette.colorRecords.map((record) => ({
    selectedCode: getOwnPaletteKnownRecord(record.code)?.code ?? null,
    defaultName: record.defaultName.trim(),
    hex: record.hex.trim(),
    secondaryColor: record.secondaryColor.trim(),
  }));

export const areComparableDraftRowsEqual = (
  left: OwnComparableDraftRow[],
  right: OwnComparableDraftRow[],
): boolean => {
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index += 1) {
    const leftRow = left[index];
    const rightRow = right[index];
    if (
      leftRow.selectedCode !== rightRow.selectedCode ||
      leftRow.defaultName !== rightRow.defaultName ||
      leftRow.hex !== rightRow.hex ||
      leftRow.secondaryColor !== rightRow.secondaryColor
    ) {
      return false;
    }
  }

  return true;
};
