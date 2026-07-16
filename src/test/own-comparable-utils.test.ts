import { describe, expect, it } from "vitest";
import { importColorsFile } from "@/data/colors";
import {
  areComparableDraftRowsEqual,
  maskHexColorInput,
  toComparableDraftRow,
  toComparableDraftRowsFromPalette,
} from "@/components/tabs/own/utils";
import { getOwnPaletteKnownCodeOptions, type OwnPaletteDraftRow } from "@/data/own-palette";

describe("own comparable row utils", () => {
  it("treats custom secondary empty as equal to primary fallback", () => {
    const palette = importColorsFile({
      schemaVersion: 1,
      paletteCode: "ownPalette",
      colors: [
        {
          defaultName: "Custom",
          hex: "#112233",
          secondaryColor: "#112233",
          categories: ["CATEGORY_OTHER"],
        },
      ],
    });

    const draftRow: OwnPaletteDraftRow = {
      id: "row-1",
      selectedCode: null,
      defaultName: "Custom",
      hex: "#112233",
      secondaryColor: "",
    };

    const equal = areComparableDraftRowsEqual(
      [toComparableDraftRow(draftRow)],
      toComparableDraftRowsFromPalette(palette),
    );

    expect(equal).toBe(true);
  });

  it("fills known defaultName when known selected code row has blank name", () => {
    const known = getOwnPaletteKnownCodeOptions()[0];
    const draftRow: OwnPaletteDraftRow = {
      id: "row-1",
      selectedCode: known.code,
      defaultName: "   ",
      hex: "#123456",
      secondaryColor: "#654321",
    };

    const comparable = toComparableDraftRow(draftRow);

    expect(comparable.selectedCode).toBe(known.code);
    expect(comparable.defaultName).toBe(known.defaultName);
  });

  it("masks hex input to always start with # and limits to six hex digits", () => {
    expect(maskHexColorInput("a1b2c3")).toBe("#A1B2C3");
    expect(maskHexColorInput("#a1b2c3ff")).toBe("#A1B2C3");
  });

  it("removes non-hex characters and supports fully clearing the input", () => {
    expect(maskHexColorInput("zz-12")).toBe("#12");
    expect(maskHexColorInput("   ")).toBe("");
  });
});
