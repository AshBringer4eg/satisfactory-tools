import { Menu, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { t } from "@/i18n";
import type { CategoryFilterOption } from "./types";

interface ColorsTabFilterControlsProps {
  totalColors: number;
  filteredCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  categoryFilters: CategoryFilterOption[];
  activeCategories: Set<string>;
  categoryCountsByCode: Map<string, number>;
  onToggleCategory: (categoryCode: string) => void;
}

const ColorsTabFilterControls = ({
  totalColors,
  filteredCount,
  search,
  onSearchChange,
  onClearSearch,
  categoryFilters,
  activeCategories,
  categoryCountsByCode,
  onToggleCategory,
}: ColorsTabFilterControlsProps) => {
  const searchFilter = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={t("colors.searchPlaceholder", { total: totalColors })}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        aria-label={t("colors.searchPlaceholder", { total: totalColors })}
        data-testid="colors-search-input"
        className="w-full bg-surface pl-10 pr-9 py-2 text-[13px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        style={{
          borderRadius: "2px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
      {search && (
        <button
          type="button"
          onClick={onClearSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={t("colors.clearSearchAria")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const categoryFilterList = (
    <div className="flex flex-col gap-1">
      {categoryFilters.map((category) => {
        const isActive = activeCategories.has(category.code);
        const count = categoryCountsByCode.get(category.code) ?? 0;

        return (
          <button
            key={category.code}
            type="button"
            onClick={() => onToggleCategory(category.code)}
            aria-pressed={isActive}
            aria-label={category.label}
            data-testid={`category-toggle-${category.code}`}
            className={`flex items-center gap-2 px-3 py-1.5 text-[12px] uppercase tracking-wider font-bold transition-all duration-150 text-left ${
              isActive
                ? "text-primary bg-primary/10"
                : "text-secondary-foreground hover:text-foreground"
            }`}
            style={{ borderRadius: "2px" }}
          >
            <div
              className={`w-2.5 h-2.5 shrink-0 transition-colors duration-150 ${
                isActive ? "bg-primary" : "bg-muted"
              }`}
              style={{ borderRadius: "1px" }}
            />
            <span className="truncate">{category.label}</span>
            <span className="ml-auto text-muted-foreground font-mono text-[11px]">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );

  const resultsSummary = (
    <div className="text-muted-foreground text-[11px] font-mono mt-2 px-3">
      {t("colors.resultsSummary", {
        filtered: filteredCount,
        total: totalColors,
      })}
    </div>
  );

  return (
    <>
      <div className="md:hidden flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="shrink-0 inline-flex items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-foreground border border-border bg-surface"
              style={{ borderRadius: "2px" }}
              aria-label={t("colors.openMenuAria")}
            >
              <Menu className="w-4 h-4" />
              {t("colors.menu")}
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm overflow-y-auto"
          >
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
              {t("colors.categories")}
            </div>
            <div className="flex flex-col gap-3">
              {categoryFilterList}
              {resultsSummary}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 min-w-0">{searchFilter}</div>
      </div>

      <div className="hidden md:flex md:w-56 shrink-0 flex-col gap-3">
        {searchFilter}
        {categoryFilterList}
        {resultsSummary}
      </div>
    </>
  );
};

export default ColorsTabFilterControls;
