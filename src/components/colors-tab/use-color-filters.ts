import { useCallback, useMemo, useState } from "react";
import type { SatisfactoryPalette } from "@/data/colors";
import { getCategoryCountsByCode } from "./filtering";
import type { CategoryFilterOption } from "./types";

interface UseColorFiltersResult {
  colors: SatisfactoryPalette["colors"];
  search: string;
  setSearch: (value: string) => void;
  clearSearch: () => void;
  activeCategories: Set<string>;
  toggleCategory: (categoryCode: string) => void;
  categoryFiltersList: CategoryFilterOption[];
  categoryCountsByCode: Map<string, number>;
}

export const useColorFilters = (
  palette: SatisfactoryPalette,
): UseColorFiltersResult => {
  const colors = palette.colors;
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );

  const categoryFiltersList = useMemo(
    () =>
      palette.categoryCodes.map((code, index) => ({
        code,
        label: palette.categories[index] ?? code,
      })),
    [palette],
  );

  const categoryCountsByCode = useMemo(
    () => getCategoryCountsByCode(colors),
    [colors],
  );

  const clearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const toggleCategory = useCallback((categoryCode: string) => {
    setActiveCategories((previous) => {
      const next = new Set(previous);

      if (next.has(categoryCode)) next.delete(categoryCode);
      else next.add(categoryCode);

      return next;
    });
  }, []);

  return {
    colors,
    search,
    setSearch,
    clearSearch,
    activeCategories,
    toggleCategory,
    categoryFiltersList,
    categoryCountsByCode,
  };
};
