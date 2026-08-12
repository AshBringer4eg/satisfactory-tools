import type { SatisfactoryColor } from "@/data/colors";
import type { CopyCounts } from "./types";

export interface IndexedSearchColor {
  color: SatisfactoryColor;
  searchableText: string;
}

const colorNameCollator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});

export const createIndexedSearchColors = (
  allColors: SatisfactoryColor[],
): IndexedSearchColor[] =>
  allColors.map((color) => ({
    color,
    searchableText: [
      color.name,
      color.defaultName,
      color.hex,
      color.secondaryColor,
      color.code,
      ...color.categories,
      ...color.categoryCodes,
    ]
      .join(" ")
      .toLowerCase(),
  }));

export const getFilteredColors = (
  indexedColors: IndexedSearchColor[],
  normalizedSearch: string,
  activeCategoryCodes: Set<string>,
  counts: CopyCounts,
) => {
  const filtered: SatisfactoryColor[] = [];

  for (const entry of indexedColors) {
    const { color, searchableText } = entry;
    const matchSearch =
      normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);
    if (!matchSearch) continue;

    const matchCategory =
      activeCategoryCodes.size === 0 ||
      color.categoryCodes.some((categoryCode) =>
        activeCategoryCodes.has(categoryCode),
      );
    if (!matchCategory) continue;

    filtered.push(color);
  }

  return filtered.sort((a, b) => {
    const byCount = (counts[b.code] ?? 0) - (counts[a.code] ?? 0);
    if (byCount !== 0) return byCount;
    return colorNameCollator.compare(a.name, b.name);
  });
};

export const getCategoryCountsByCode = (colors: SatisfactoryColor[]) => {
  const counts = new Map<string, number>();

  for (const color of colors) {
    for (const categoryCode of color.categoryCodes) {
      counts.set(categoryCode, (counts.get(categoryCode) ?? 0) + 1);
    }
  }

  return counts;
};
