import { useCallback, useEffect, useRef, useState, type AnimationEvent } from "react";
import { CircleHelp, Menu, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useTutorial } from "@/tutorials/tutorial-context";
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
            data-tutorial={
              category.code === "CATEGORY_FUELS"
                ? "filtering-category-fuels"
                : "category-filters"
            }
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

    <div className={resultsSummaryClassName} data-tutorial="results-summary">
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
  const {
    activeTutorial,
    isRunning,
    registerSearchSetter,
    reportTutorialAction,
    startTutorial,
  } = useTutorial();
  const isFilteringTutorial = activeTutorial === "filtering" && isRunning;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pendingMobileDrawerActionRef = useRef<
    | { type: "open-filter-menu" }
    | { type: "category"; code: string }
    | null
  >(null);
  const searchPlaceholder = t("colors.searchPlaceholder", { total: totalColors });
  const handleSearchChange = useCallback(
    (value: string) => {
      onSearchChange(value);
      reportTutorialAction({ type: "search", value });
    },
    [onSearchChange, reportTutorialAction],
  );

  useEffect(
    () => registerSearchSetter(handleSearchChange),
    [handleSearchChange, registerSearchSetter],
  );

  const handleMobileDrawerAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;

      const drawerState = event.currentTarget.dataset.state;
      const pendingAction = pendingMobileDrawerActionRef.current;
      if (!pendingAction) return;

      if (
        (drawerState === "open" && pendingAction.type !== "open-filter-menu") ||
        (drawerState === "closed" && pendingAction.type !== "category")
      ) {
        return;
      }

      pendingMobileDrawerActionRef.current = null;
      reportTutorialAction(pendingAction);
    },
    [reportTutorialAction],
  );

  const handleMobileCategoryToggle = useCallback(
    (categoryCode: string) => {
      onToggleCategory(categoryCode);
      if (isFilteringTutorial && mobileMenuOpen) {
        pendingMobileDrawerActionRef.current = {
          type: "category",
          code: categoryCode,
        };
        setMobileMenuOpen(false);
        return;
      }

      reportTutorialAction({ type: "category", code: categoryCode });
    },
    [isFilteringTutorial, mobileMenuOpen, onToggleCategory, reportTutorialAction],
  );

  const startFilteringTutorial = useCallback(
    () => startTutorial("filtering"),
    [startTutorial],
  );

  const searchFilter = (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          readOnly={isFilteringTutorial}
          aria-readonly={isFilteringTutorial}
          aria-label={searchPlaceholder}
          data-tutorial="search-input"
          data-testid="colors-search-input"
          className={searchInputClassName}
        />
        {search && (
          <button
            type="button"
            onClick={onClearSearch}
            disabled={isFilteringTutorial}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={t("colors.clearSearchAria")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={startFilteringTutorial}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-border bg-surface text-foreground hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary"
        aria-label={t("tutorials.quickActions.startFiltering")}
        title={t("tutorials.quickActions.startFiltering")}
        data-testid="tutorial-filtering-inline-trigger"
      >
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <>
      <div className="md:hidden flex items-center gap-2">
        <Sheet
          open={mobileMenuOpen}
          onOpenChange={(open) => {
            setMobileMenuOpen(open);
            if (open && isFilteringTutorial) {
              pendingMobileDrawerActionRef.current = {
                type: "open-filter-menu",
              };
              return;
            }

            if (open) reportTutorialAction({ type: "open-filter-menu" });
          }}
        >
          <SheetTrigger asChild>
            <button
              type="button"
              className={menuButtonClassName}
              data-tutorial="filter-menu"
              aria-label={t("colors.openMenuAria")}
            >
              <Menu className="w-4 h-4" />
              {t("colors.menu")}
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm overflow-y-auto"
            onAnimationEnd={handleMobileDrawerAnimationEnd}
          >
            <SheetTitle className="sr-only">{t("colors.categories")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("colors.openMenuAria")}
            </SheetDescription>
            <CategoryFiltersPanel
              totalColors={totalColors}
              filteredCount={filteredCount}
              categoryFilters={categoryFilters}
              activeCategories={activeCategories}
              categoryCountsByCode={categoryCountsByCode}
              onToggleCategory={handleMobileCategoryToggle}
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
          onToggleCategory={(categoryCode) => {
            onToggleCategory(categoryCode);
            reportTutorialAction({ type: "category", code: categoryCode });
          }}
        />
      </div>
    </>
  );
};

export default ColorsTabFilterControls;
