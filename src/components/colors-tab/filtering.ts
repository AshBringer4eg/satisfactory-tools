import type { SatisfactoryColor } from "@/data/colors";
import type { CopyCounts } from "./types";

export const getFilteredColors = (
  allColors: SatisfactoryColor[],
  search: string,
  activeCategoryCodes: Set<string>,
  counts: CopyCounts,
) => {
  const normalizedSearch = search.toLowerCase();

  return allColors
    .filter((color) => {
      const matchSearch =
        !normalizedSearch ||
        color.name.toLowerCase().includes(normalizedSearch) ||
        color.hex.toLowerCase().includes(normalizedSearch);
      const matchCategory =
        activeCategoryCodes.size === 0 ||
        color.categoryCodes.some((categoryCode) =>
          activeCategoryCodes.has(categoryCode),
        );
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      const byCount = (counts[b.code] ?? 0) - (counts[a.code] ?? 0);
      if (byCount !== 0) return byCount;
      return a.name.localeCompare(b.name);
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
