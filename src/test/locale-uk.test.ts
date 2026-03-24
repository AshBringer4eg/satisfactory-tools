import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getCategoryName, getColorName, setLocale, t } from "@/i18n";

describe("ukrainian locale samples", () => {
  beforeEach(() => {
    setLocale("uk");
  });

  afterAll(() => {
    setLocale("en");
  });

  it("resolves color samples", () => {
    expect(getColorName("COLOR_LIMESTONE", "fallback")).toBe("Вапняк");
    expect(getColorName("COLOR_TURBOFUEL", "fallback")).toBe("Турбопаливо");
    expect(getColorName("COLOR_ADAPTIVE_CONTROL_UNIT", "fallback")).toBe("Адаптивний блок управління");
    expect(getColorName("COLOR_POWER_SHARD", "fallback")).toBe("Енергетичний уламок");
    expect(getColorName("COLOR_NITROGEN_GAS", "fallback")).toBe("Азот");
  });

  it("resolves category samples", () => {
    expect(getCategoryName("CATEGORY_ORES")).toBe("Руди");
    expect(getCategoryName("CATEGORY_LIGHT_FLUORESCENT")).toBe("Світло: Флуоресцентне");
    expect(getCategoryName("CATEGORY_QUANTUM_TECHNOLOGY")).toBe("Квантові технології");
  });

  it("resolves light samples", () => {
    expect(getColorName("LIGHT_CANDLE", "fallback")).toBe("Свічка");
    expect(getColorName("LIGHT_HALOGEN", "fallback")).toBe("Галогенна лампа");
    expect(getColorName("LIGHT_MERCURY_VAPOR", "fallback")).toBe("Ртутна лампа");
  });

  it("resolves header and footer samples", () => {
    expect(t("header.title")).toBe("ТЕРМІНАЛ_ДОВІДКИ_ІНЖЕНЕРА");
    expect(t("footer.changelog")).toBe("ЖУРНАЛ_ЗМІН");
  });
});
