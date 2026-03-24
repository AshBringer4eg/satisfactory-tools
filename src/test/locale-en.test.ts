import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getCategoryName, getColorName, setLocale, t } from "@/i18n";

describe("english locale samples", () => {
  beforeEach(() => {
    setLocale("en");
  });

  afterAll(() => {
    setLocale("en");
  });

  it("resolves color samples", () => {
    expect(getColorName("COLOR_LIMESTONE", "fallback")).toBe("Limestone");
    expect(getColorName("COLOR_TURBOFUEL", "fallback")).toBe("Turbofuel");
    expect(getColorName("COLOR_ADAPTIVE_CONTROL_UNIT", "fallback")).toBe("Adaptive Control Unit");
    expect(getColorName("COLOR_POWER_SHARD", "fallback")).toBe("Power Shard");
    expect(getColorName("COLOR_NITROGEN_GAS", "fallback")).toBe("Nitrogen Gas");
  });

  it("resolves category samples", () => {
    expect(getCategoryName("CATEGORY_ORES")).toBe("Ores");
    expect(getCategoryName("CATEGORY_LIGHT_FLUORESCENT")).toBe("Light: Fluorescent");
    expect(getCategoryName("CATEGORY_QUANTUM_TECHNOLOGY")).toBe("Quantum Technology");
  });

  it("resolves light samples", () => {
    expect(getColorName("LIGHT_CANDLE", "fallback")).toBe("Candle");
    expect(getColorName("LIGHT_HALOGEN", "fallback")).toBe("Halogen");
    expect(getColorName("LIGHT_MERCURY_VAPOR", "fallback")).toBe("Mercury Vapor");
  });

  it("resolves header and footer samples", () => {
    expect(t("header.title")).toBe("ENGINEER_REFERENCE_TERMINAL");
    expect(t("footer.changelog")).toBe("CHANGELOG");
  });
});
