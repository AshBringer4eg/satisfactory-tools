import { afterEach, describe, expect, it } from "vitest";
import { setLocale, t } from "@/i18n";

afterEach(() => {
  setLocale("en");
});

describe("ui translation fallback", () => {
  it("falls back to english when active locale key is missing", () => {
    setLocale("de");
    expect(t("colors.menu")).toBe("Menu");
  });

  it("falls back to normalized key when english key is missing", () => {
    setLocale("de");
    expect(t("ui.veryMissingKeyName")).toBe("very Missing Key Name");
  });
});
