import { describe, expect, it } from "vitest";
import {
  buildOwnPaletteFromDraftRows,
  createDefaultOwnPalette,
  createOwnPaletteDraftRowsFromPalette,
  exportOwnPaletteFileToBase64,
  getOwnPaletteCode,
  getOwnPaletteKnownCodeOptions,
  importOwnPaletteBase64ToDraftRows,
  validateAndNormalizeOwnPaletteDraft,
  type OwnPaletteDraftRow,
} from "@/data/own-palette";

describe("own palette draft helpers", () => {
  it("uses primary color as secondary when secondary is empty", () => {
    const rows: OwnPaletteDraftRow[] = [
      {
        id: "row-1",
        selectedCode: null,
        defaultName: "Custom Paint",
        hex: "#112233",
        secondaryColor: "",
      },
    ];

    const result = validateAndNormalizeOwnPaletteDraft(rows);

    expect(result.errors).toEqual([]);
    expect(result.normalizedFile?.colors[0].hex).toBe("#112233");
    expect(result.normalizedFile?.colors[0].secondaryColor).toBe("#112233");
  });

  it("accepts shorthand hex colors (#RGB)", () => {
    const rows: OwnPaletteDraftRow[] = [
      {
        id: "row-1",
        selectedCode: null,
        defaultName: "Custom Paint",
        hex: "#c64",
        secondaryColor: "#0f0",
      },
    ];

    const result = validateAndNormalizeOwnPaletteDraft(rows);
    expect(result.errors).toEqual([]);
    expect(result.normalizedFile?.colors[0].hex).toBe("#c64");
    expect(result.normalizedFile?.colors[0].secondaryColor).toBe("#0f0");
  });

  it("reports duplicate known codes", () => {
    const knownCode = getOwnPaletteKnownCodeOptions()[0].code;
    const rows: OwnPaletteDraftRow[] = [
      {
        id: "row-1",
        selectedCode: knownCode,
        defaultName: "One",
        hex: "#123456",
        secondaryColor: "#654321",
      },
      {
        id: "row-2",
        selectedCode: knownCode,
        defaultName: "Two",
        hex: "#abcdef",
        secondaryColor: "#fedcba",
      },
    ];

    const result = validateAndNormalizeOwnPaletteDraft(rows);

    expect(result.normalizedFile).toBeNull();
    expect(result.errors.some((error) => /duplicate code/i.test(error))).toBe(
      true,
    );
  });

  it("roundtrips own palette through base64 and forces own paletteCode", () => {
    const ownPalette = createDefaultOwnPalette();
    const rows = createOwnPaletteDraftRowsFromPalette(ownPalette).slice(0, 4);
    const built = buildOwnPaletteFromDraftRows(rows);

    expect(built.normalizedFile).not.toBeNull();
    const encoded = exportOwnPaletteFileToBase64({
      ...built.normalizedFile!,
      paletteCode: "external-palette",
    });

    const imported = importOwnPaletteBase64ToDraftRows(encoded);
    expect(imported.errors).toEqual([]);
    expect(imported.rows).not.toBeNull();

    const rebuilt = buildOwnPaletteFromDraftRows(imported.rows!);
    expect(rebuilt.errors).toEqual([]);
    expect(rebuilt.normalizedFile?.paletteCode).toBe(getOwnPaletteCode());
  });

  it("rejects malformed base64 import strings", () => {
    const imported = importOwnPaletteBase64ToDraftRows("%%%");
    expect(imported.rows).toBeNull();
    expect(imported.errors).toContain("Malformed base64 string.");
  });

  it("rejects invalid object structure on import", () => {
    const malformed = Buffer.from(
      JSON.stringify({
        schemaVersion: 1,
        paletteCode: "wrong",
      }),
      "utf-8",
    ).toString("base64");

    const imported = importOwnPaletteBase64ToDraftRows(malformed);

    expect(imported.rows).toBeNull();
    expect(imported.errors.some((error) => /invalid colors field/i.test(error))).toBe(
      true,
    );
  });
});
