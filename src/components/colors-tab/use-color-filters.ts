import { useCallback, useMemo, useState } from "react";
import type { SatisfactoryPalette } from "@/data/colors";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getCategoryCountsByCode } from "./filtering";
import type { CategoryFilterOption } from "./types";

interface UseColorFiltersResult {
  colors: SatisfactoryPalette["colors"];
  search: string;
  searchQuery: string;
  setSearch: (value: string) => void;
  clearSearch: () => void;
  resetFilters: () => void;
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
  const debouncedSearch = useDebouncedValue(search, 120);
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

  const searchQuery = useMemo(
    () => debouncedSearch.trim().toLowerCase(),
    [debouncedSearch],
  );

  const clearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setActiveCategories(new Set());
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
    searchQuery,
    setSearch,
    clearSearch,
    resetFilters,
    activeCategories,
    toggleCategory,
    categoryFiltersList,
    categoryCountsByCode,
  };
};
