import { describe, expect, it } from "vitest";
import type { SatisfactoryColor } from "@/data/colors";
import {
  createIndexedSearchColors,
  getFilteredColors,
} from "@/components/colors-tab/filtering";

const color = {
  code: "COLOR_TEST_ITEM",
  defaultName: "Default Item Name",
  name: "Localized Item Name",
  hex: "#123456",
  secondaryColor: "#ABCDEF",
  categoryCodes: ["CATEGORY_FUELS"],
  categories: ["Fuel items"],
} as SatisfactoryColor;

const getMatches = (search: string) =>
  getFilteredColors(
    createIndexedSearchColors([color]),
    search,
    new Set(),
    {},
  );

describe("color search index", () => {
  it.each([
    "localized item",
    "default item",
    "123456",
    "abcdef",
    "test_item",
    "fuel items",
    "category_fuels",
  ])("matches related field: %s", (search) => {
    expect(getMatches(search)).toEqual([color]);
  });
});
