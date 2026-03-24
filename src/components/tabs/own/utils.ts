import type { SatisfactoryPalette } from "@/data/colors";
import { getOwnPaletteKnownRecord, type OwnPaletteDraftRow } from "@/data/own-palette";
import type { OwnComparableDraftRow } from "./types";

export const OWN_CUSTOM_CODE_SENTINEL = "__OWN_CUSTOM_CODE__";

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const isHexColor = (value: string): boolean => HEX_COLOR_REGEX.test(value.trim());

export const toComparableDraftRow = (row: OwnPaletteDraftRow): OwnComparableDraftRow => ({
  selectedCode: row.selectedCode,
  defaultName: row.defaultName,
  hex: row.hex,
  secondaryColor: row.secondaryColor,
});

export const toComparableDraftRowsFromPalette = (
  palette: SatisfactoryPalette,
): OwnComparableDraftRow[] =>
  palette.colorRecords.map((record) => ({
    selectedCode: getOwnPaletteKnownRecord(record.code) ? record.code : null,
    defaultName: record.defaultName,
    hex: record.hex,
    secondaryColor: record.secondaryColor,
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
