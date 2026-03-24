import type { ColorCode, ColorsFile, SatisfactoryPalette } from "@/data/colors";
import type { OwnPaletteDraftRow } from "@/data/own-palette";

export type OwnMode = "use" | "edit";
export type OwnEditableField = "defaultName" | "hex" | "secondaryColor";

export type KnownCodeOption = {
  code: ColorCode;
  label: string;
};

export type OwnInitialState = {
  savedPalette: SatisfactoryPalette;
  savedPaletteFile: ColorsFile | null;
  draftRows: OwnPaletteDraftRow[];
  loadErrors: string[];
};

export type OwnComparableDraftRow = {
  selectedCode: ColorCode | null;
  defaultName: string;
  hex: string;
  secondaryColor: string;
};
