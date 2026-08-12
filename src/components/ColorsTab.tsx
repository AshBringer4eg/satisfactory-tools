import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleHelp } from "lucide-react";
import type { SatisfactoryColor, SatisfactoryPalette } from "@/data/colors";
import type { ShareCardMode } from "@/lib/share-links";
import { DEFAULT_COPY_COUNTS_STORAGE_KEY } from "@/config/storage";
import { t, useLocale } from "@/i18n";
import ColorHarmonyDialog from "./tabs/own/ColorHarmonyDialog";
import ColorsTabFilterControls from "./colors-tab/ColorsTabFilterControls";
import ColorsTabFloatingSwatch from "./colors-tab/ColorsTabFloatingSwatch";
import ColorsTabGrid from "./colors-tab/ColorsTabGrid";
import {
  createIndexedSearchColors,
  getFilteredColors,
} from "./colors-tab/filtering";
import type { ReorderCommit } from "./colors-tab/types";
import { useColorCopyCounts } from "./colors-tab/use-color-copy-counts";
import { useColorFilters } from "./colors-tab/use-color-filters";
import { useColorReorderAnimation } from "./colors-tab/use-color-reorder-animation";
import { useTutorial } from "@/tutorials/tutorial-context";

interface ColorsTabProps {
  palette: SatisfactoryPalette;
  swatchMode?: "solo" | "duo";
  copyCountsStorageKey?: string;
  topContent?: ReactNode;
  shareLinksEnabled?: boolean;
}

const ColorsTab = ({
  palette,
  swatchMode = "solo",
  copyCountsStorageKey = DEFAULT_COPY_COUNTS_STORAGE_KEY,
  topContent,
  shareLinksEnabled = true,
}: ColorsTabProps) => {
  useLocale();
  const {
    activeTutorial,
    isRunning,
    registerFilteringResetter,
    reportTutorialAction,
    startTutorial,
  } = useTutorial();
  const [filteringResultSettled, setFilteringResultSettled] = useState(false);
  const [harmonySeed, setHarmonySeed] = useState<{
    primaryHex: string;
    secondaryHex: string;
  } | null>(null);

  const {
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
  } = useColorFilters(palette);

  useEffect(
    () => registerFilteringResetter(resetFilters),
    [registerFilteringResetter, resetFilters],
  );

  const startReorderRef = useRef((_params: ReorderCommit) => {});
  const resetReorderRef = useRef(() => {});
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const indexedColors = useMemo(
    () => createIndexedSearchColors(colors),
    [colors],
  );

  const handleCopyCountCommitted = useCallback((params: ReorderCommit) => {
    startReorderRef.current(params);
  }, []);

  const handleCopyCountsReset = useCallback(() => {
    resetReorderRef.current();
  }, []);

  const {
    copyCounts,
    pendingCopyCounts,
    queueCopyCount,
    flushQueuedCopyCount,
  } = useColorCopyCounts({
    storageKey: copyCountsStorageKey,
    indexedColors,
    searchQuery: deferredSearchQuery,
    activeCategoryCodes: activeCategories,
    onCopyCountCommitted: handleCopyCountCommitted,
    onReset: handleCopyCountsReset,
  });

  const filteredColors = useMemo(
    () =>
      getFilteredColors(
        indexedColors,
        deferredSearchQuery,
        activeCategories,
        copyCounts,
      ),
    [indexedColors, deferredSearchQuery, activeCategories, copyCounts],
  );
  const isFilteringResultFiltered =
    activeTutorial === "filtering" &&
    isRunning &&
    search.trim().toLowerCase() === "packaged" &&
    deferredSearchQuery === "packaged" &&
    filteredColors.length > 0;
  const highlightFilteringResult =
    isFilteringResultFiltered && filteringResultSettled;
  const filteringResultKey = isFilteringResultFiltered
    ? filteredColors.map((color) => color.code).join("|")
    : "";
  const filteringResultAnchor = activeCategories.has("CATEGORY_FUELS")
    ? "filtering-filtered-swatches"
    : "filtering-results-grid";

  useEffect(() => {
    setFilteringResultSettled(false);
  }, [filteringResultKey]);

  const handleFilteringAnimationStart = useCallback(() => {
    setFilteringResultSettled(false);
  }, []);

  const handleFilteringAnimationComplete = useCallback(() => {
    if (isFilteringResultFiltered) {
      setFilteringResultSettled(true);
    }
  }, [isFilteringResultFiltered]);
  const shareMode: ShareCardMode | null = shareLinksEnabled
    ? swatchMode === "duo"
      ? "two"
      : "one"
    : null;

  const handleHarmonyOpen = useCallback((color: SatisfactoryColor) => {
    reportTutorialAction({ type: "open-harmony" });
    setHarmonySeed({
      primaryHex: color.hex,
      secondaryHex: swatchMode === "duo" ? color.secondaryColor : "",
    });
  }, [reportTutorialAction, swatchMode]);

  const handleHarmonyDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setHarmonySeed(null);
    }
  }, []);

  const {
    movingColorCode,
    floatingMove,
    gridTokens,
    reorderDelayByCode,
    floatingMoveDuration,
    placeholderRef,
    registerSwatchNode,
    startReorder,
    completeFloatingMove,
    reset,
  } = useColorReorderAnimation({ filteredColors });

  startReorderRef.current = startReorder;
  resetReorderRef.current = reset;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <ColorHarmonyDialog
        open={Boolean(harmonySeed)}
        onOpenChange={handleHarmonyDialogOpenChange}
        initialPrimaryHex={harmonySeed?.primaryHex ?? "#CB603A"}
        initialSecondaryHex={harmonySeed?.secondaryHex ?? ""}
      />

      <ColorsTabFilterControls
        totalColors={colors.length}
        filteredCount={filteredColors.length}
        search={search}
        onSearchChange={setSearch}
        onClearSearch={clearSearch}
        categoryFilters={categoryFiltersList}
        activeCategories={activeCategories}
        categoryCountsByCode={categoryCountsByCode}
        onToggleCategory={toggleCategory}
      />

      <div className="flex-1 min-w-0">
        {topContent ? <div className="mb-2">{topContent}</div> : null}
        <div className="mb-2 flex items-start gap-2 font-mono text-[9px] leading-tight text-orange-400/90">
          <span className="min-w-0 flex-1">{t("header.manualInstruction")}</span>
          <button
            type="button"
            onClick={() => startTutorial("swatches")}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] border border-border bg-surface text-foreground hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={t("tutorials.quickActions.startSwatches")}
            title={t("tutorials.quickActions.startSwatches")}
            data-testid="tutorial-swatches-inline-trigger"
          >
            <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <ColorsTabGrid
          gridTokens={gridTokens}
          swatchMode={swatchMode}
          shareMode={shareMode}
          copyCounts={copyCounts}
          pendingCopyCounts={pendingCopyCounts}
          movingColorCode={movingColorCode}
          floatingMove={floatingMove}
          reorderDelayByCode={reorderDelayByCode}
          highlightFilteringResult={highlightFilteringResult}
          filteringResultAnchor={filteringResultAnchor}
          trackFilteringResultLayout={isFilteringResultFiltered}
          filteringAnimationKey={filteringResultKey}
          onFilteringAnimationStart={handleFilteringAnimationStart}
          onFilteringAnimationComplete={handleFilteringAnimationComplete}
          placeholderRef={placeholderRef}
          registerSwatchNode={registerSwatchNode}
          onCopy={queueCopyCount}
          onSwatchLeave={flushQueuedCopyCount}
          onHarmonyOpen={handleHarmonyOpen}
        />

        {filteredColors.length === 0 && (
          <div className="flex items-center justify-center h-40 font-mono text-muted-foreground text-[13px]">
            {t("colors.noData")}
          </div>
        )}
      </div>

      <ColorsTabFloatingSwatch
        floatingMove={floatingMove}
        swatchMode={swatchMode}
        copyCounts={copyCounts}
        floatingMoveDuration={floatingMoveDuration}
        onAnimationComplete={completeFloatingMove}
      />
    </div>
  );
};

export default ColorsTab;
