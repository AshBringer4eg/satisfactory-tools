import { describe, expect, it } from "vitest";
import { importColorsFile, exportColorsFile } from "@/data/colors";

describe("colors file import/export", () => {
  it("generates unique codes when entries are missing code", () => {
    const palette = importColorsFile({
      schemaVersion: 1,
      paletteCode: "custom",
      colors: [
        {
          defaultName: "Packaged Turbofuel",
          hex: "#e3101f",
          secondaryColor: "#10100e",
          categories: ["CATEGORY_FUELS"],
        },
        {
          defaultName: "Packaged Turbofuel",
          hex: "#ec0414",
          secondaryColor: "#feeb23",
          categories: ["CATEGORY_UNKNOWN"],
        },
      ],
    });

    expect(palette.colors[0].code).toBe("COLOR_PACKAGED_TURBOFUEL");
    expect(palette.colors[1].code).toBe("COLOR_PACKAGED_TURBOFUEL_2");
    expect(palette.colors[1].categoryCodes).toEqual(["CATEGORY_OTHER"]);
  });

  it("throws when duplicate explicit code is provided", () => {
    expect(() =>
      importColorsFile({
        schemaVersion: 1,
        paletteCode: "dup",
        colors: [
          {
            code: "COLOR_DUP",
            defaultName: "One",
            hex: "#111111",
            secondaryColor: "#222222",
            categories: ["CATEGORY_FUELS"],
          },
          {
            code: "COLOR_DUP",
            defaultName: "Two",
            hex: "#333333",
            secondaryColor: "#444444",
            categories: ["CATEGORY_FUELS"],
          },
        ],
      }),
    ).toThrow(/Duplicate color code/);
  });

  it("validates hex fields", () => {
    expect(() =>
      importColorsFile({
        schemaVersion: 1,
        paletteCode: "bad-hex",
        colors: [
          {
            defaultName: "Bad",
            hex: "#12345",
            secondaryColor: "#222222",
            categories: ["CATEGORY_FUELS"],
          },
        ],
      }),
    ).toThrow(/Invalid hex/);
  });

  it("falls back to defaultName when color translation is missing", () => {
    const palette = importColorsFile({
      schemaVersion: 1,
      paletteCode: "unknown-code",
      colors: [
        {
          code: "COLOR_CUSTOM_USER_ENTRY",
          defaultName: "My User Color",
          hex: "#abcdef",
          secondaryColor: "#010203",
          categories: ["CATEGORY_FUELS"],
        },
      ],
    });

    expect(palette.colors[0].name).toBe("My User Color");
  });

  it("exports schemaVersion 1 format", () => {
    const palette = importColorsFile({
      schemaVersion: 1,
      paletteCode: "for-export",
      colors: [
        {
          defaultName: "Demo",
          hex: "#111111",
          secondaryColor: "#222222",
          categories: ["CATEGORY_FUELS"],
        },
      ],
    });

    const exported = exportColorsFile(palette);
    expect(exported.schemaVersion).toBe(1);
    expect(exported.paletteCode).toBe("for-export");
    expect(exported.colors).toHaveLength(1);
  });
});
