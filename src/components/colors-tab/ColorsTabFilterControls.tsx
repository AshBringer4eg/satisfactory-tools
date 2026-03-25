import { Menu, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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

interface CategoryFiltersPanelProps {
  totalColors: number;
  filteredCount: number;
  categoryFilters: CategoryFilterOption[];
  activeCategories: Set<string>;
  categoryCountsByCode: Map<string, number>;
  onToggleCategory: (categoryCode: string) => void;
  showHeading?: boolean;
}

const searchInputClassName =
  "w-full rounded-[2px] border border-white/10 bg-surface pl-10 pr-9 py-2 text-[13px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";
const menuButtonClassName =
  "shrink-0 inline-flex items-center gap-2 rounded-[2px] border border-border bg-surface px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-foreground";
const categoryButtonClassName =
  "flex items-center gap-2 rounded-[2px] px-3 py-1.5 text-left text-[12px] font-bold uppercase tracking-wider transition-all duration-150";
const categoryBadgeClassName =
  "h-2.5 w-2.5 shrink-0 rounded-[1px] transition-colors duration-150";
const resultsSummaryClassName =
  "mt-2 px-3 font-mono text-[11px] text-muted-foreground";

const CategoryFiltersPanel = ({
  totalColors,
  filteredCount,
  categoryFilters,
  activeCategories,
  categoryCountsByCode,
  onToggleCategory,
  showHeading = false,
}: CategoryFiltersPanelProps) => (
  <div className="flex flex-col gap-3">
    {showHeading ? (
      <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {t("colors.categories")}
      </div>
    ) : null}

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
            className={cn(
              categoryButtonClassName,
              isActive
                ? "bg-primary/10 text-primary"
                : "text-secondary-foreground hover:text-foreground",
            )}
          >
            <div
              className={cn(
                categoryBadgeClassName,
                isActive ? "bg-primary" : "bg-muted",
              )}
            />
            <span className="truncate">{category.label}</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {count}
            </span>
          </button>
        );
      })}
    </div>

    <div className={resultsSummaryClassName}>
      {t("colors.resultsSummary", {
        filtered: filteredCount,
        total: totalColors,
      })}
    </div>
  </div>
);

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
  const searchPlaceholder = t("colors.searchPlaceholder", { total: totalColors });
  const searchFilter = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        aria-label={searchPlaceholder}
        data-testid="colors-search-input"
        className={searchInputClassName}
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

  return (
    <>
      <div className="md:hidden flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={menuButtonClassName}
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
            <CategoryFiltersPanel
              totalColors={totalColors}
              filteredCount={filteredCount}
              categoryFilters={categoryFilters}
              activeCategories={activeCategories}
              categoryCountsByCode={categoryCountsByCode}
              onToggleCategory={onToggleCategory}
              showHeading
            />
          </SheetContent>
        </Sheet>
        <div className="flex-1 min-w-0">{searchFilter}</div>
      </div>

      <div className="hidden md:flex md:w-56 shrink-0 flex-col gap-3">
        {searchFilter}
        <CategoryFiltersPanel
          totalColors={totalColors}
          filteredCount={filteredCount}
          categoryFilters={categoryFilters}
          activeCategories={activeCategories}
          categoryCountsByCode={categoryCountsByCode}
          onToggleCategory={onToggleCategory}
        />
      </div>
    </>
  );
};

export default ColorsTabFilterControls;
