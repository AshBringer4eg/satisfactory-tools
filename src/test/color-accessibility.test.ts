import { describe, expect, it } from "vitest";
import {
  DEFAULT_COLOR_ACCESSIBILITY_SETTINGS,
  getSwatchOverlayToken,
  normalizeHexColor,
  parseColorAccessibilitySettingsJson,
  simulateHexColor,
} from "@/lib/color-accessibility";

describe("color accessibility utilities", () => {
  it("normalizes and simulates hex colors without changing normal mode", () => {
    expect(normalizeHexColor("#0f0")).toBe("#00ff00");
    expect(simulateHexColor("#00ff00", "normal")).toBe("#00ff00");
    expect(simulateHexColor("#00ff00", "protan")).toBe("#ffc900");
    expect(simulateHexColor("#00ff00", "deutan")).not.toBe("#00ff00");
  });

  it("assigns stable overlay tokens per swatch part", () => {
    const primaryToken = getSwatchOverlayToken("COLOR_GREEN", "primary");
    const secondaryToken = getSwatchOverlayToken("COLOR_GREEN", "secondary");

    expect(primaryToken).toEqual(getSwatchOverlayToken("COLOR_GREEN", "primary"));
    expect(primaryToken.symbol).not.toBe(secondaryToken.symbol);
    expect(primaryToken.pattern).not.toBe(secondaryToken.pattern);
  });

  it("parses persisted settings defensively", () => {
    expect(parseColorAccessibilitySettingsJson(null)).toEqual(
      DEFAULT_COLOR_ACCESSIBILITY_SETTINGS,
    );
    expect(parseColorAccessibilitySettingsJson("{bad json")).toEqual(
      DEFAULT_COLOR_ACCESSIBILITY_SETTINGS,
    );
    expect(
      parseColorAccessibilitySettingsJson(
        JSON.stringify({
          visionMode: "deutan",
          showSymbols: true,
          showPatterns: true,
        }),
      ),
    ).toEqual({
      visionMode: "deutan",
      showSymbols: true,
      showPatterns: true,
    });
  });
});
