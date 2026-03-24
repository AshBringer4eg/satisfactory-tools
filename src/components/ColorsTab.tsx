import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import {
  type ColorCode,
  type SatisfactoryPalette,
  type SatisfactoryColor,
} from "@/data/colors";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ColorSwatch from "./ColorSwatch";
import { DEFAULT_COPY_COUNTS_STORAGE_KEY, RESET_COPY_COUNTS_EVENT } from "@/config/storage";
import { t, useLocale } from "@/i18n";

const REORDER_STAGGER_STEP = 0.018;
const REORDER_STAGGER_MAX = 0.42;
const FLOAT_MOVE_MIN_DURATION = 0.28;
const FLOAT_MOVE_MAX_DURATION = 1.2;
const FLOAT_MOVE_PIXELS_PER_SECOND = 680;

type CopyCounts = Record<string, number>;
type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};
type FloatingMove = {
  colorCode: ColorCode;
  color: SatisfactoryColor;
  targetIndex: number;
  fromRect: Rect;
  toRect: Rect | null;
};
type GridToken =
  | { kind: "color"; color: SatisfactoryColor }
  | { kind: "placeholder"; key: string };

const readCopyCounts = (storageKey: string): CopyCounts => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalized: CopyCounts = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        normalized[key] = Math.floor(value);
      }
    }

    return normalized;
  } catch {
    return {};
  }
};

const getFilteredColors = (
  allColors: SatisfactoryColor[],
  search: string,
  activeCategoryCodes: Set<string>,
  counts: CopyCounts,
) =>
  allColors
    .filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.hex.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        activeCategoryCodes.size === 0 ||
        c.categoryCodes.some((categoryCode) =>
          activeCategoryCodes.has(categoryCode),
        );
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const byCount = (counts[b.code] ?? 0) - (counts[a.code] ?? 0);
      if (byCount !== 0) return byCount;
      return a.name.localeCompare(b.name);
    });

interface ColorsTabProps {
  palette: SatisfactoryPalette;
  swatchMode?: "solo" | "duo";
  copyCountsStorageKey?: string;
  topContent?: ReactNode;
}

const ColorsTab = ({
  palette,
  swatchMode = "solo",
  copyCountsStorageKey = DEFAULT_COPY_COUNTS_STORAGE_KEY,
  topContent,
}: ColorsTabProps) => {
  useLocale();
  const colors = palette.colors;
  const categoryFiltersList = useMemo(
    () =>
      palette.categoryCodes.map((code, index) => ({
        code,
        label: palette.categories[index] ?? code,
      })),
    [palette],
  );
  const categoryCountsByCode = useMemo(() => {
    const counts = new Map<string, number>();
    for (const color of colors) {
      for (const categoryCode of color.categoryCodes) {
        counts.set(categoryCode, (counts.get(categoryCode) ?? 0) + 1);
      }
    }
    return counts;
  }, [colors]);
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );
  const [copyCounts, setCopyCounts] = useState<CopyCounts>(() =>
    readCopyCounts(copyCountsStorageKey),
  );
  const [pendingCopyCounts, setPendingCopyCounts] = useState<CopyCounts>({});
  const [movingColorCode, setMovingColorCode] = useState<ColorCode | null>(
    null,
  );
  const [floatingMove, setFloatingMove] = useState<FloatingMove | null>(null);
  const movingIndicatorTimeoutRef = useRef<number | null>(null);
  const previousOrderRef = useRef<ColorCode[]>([]);
  const swatchNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        copyCountsStorageKey,
        JSON.stringify(copyCounts),
      );
    } catch {
      // Ignore storage write failures (private mode / quota restrictions).
    }
  }, [copyCounts, copyCountsStorageKey]);

  useEffect(() => {
    setCopyCounts(readCopyCounts(copyCountsStorageKey));
    setPendingCopyCounts({});
    setMovingColorCode(null);
    setFloatingMove(null);
  }, [copyCountsStorageKey]);

  useEffect(() => {
    return () => {
      if (movingIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(movingIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const scheduleMovingIndicatorReset = useCallback((delay = 900) => {
    if (movingIndicatorTimeoutRef.current !== null) {
      window.clearTimeout(movingIndicatorTimeoutRef.current);
    }
    movingIndicatorTimeoutRef.current = window.setTimeout(() => {
      setMovingColorCode(null);
      movingIndicatorTimeoutRef.current = null;
    }, delay);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResetCounters = () => {
      setCopyCounts({});
      setPendingCopyCounts({});
      setMovingColorCode(null);
      setFloatingMove(null);
    };

    window.addEventListener(RESET_COPY_COUNTS_EVENT, handleResetCounters);
    return () =>
      window.removeEventListener(RESET_COPY_COUNTS_EVENT, handleResetCounters);
  }, []);

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const queueCopyCount = useCallback((colorCode: ColorCode) => {
    setPendingCopyCounts((prev) => ({
      ...prev,
      [colorCode]: (prev[colorCode] ?? 0) + 1,
    }));
  }, []);

  const filtered = useMemo(
    () => getFilteredColors(colors, search, activeCategories, copyCounts),
    [colors, search, activeCategories, copyCounts],
  );

  const flushQueuedCopyCount = useCallback(
    (colorCode: ColorCode) => {
      const pendingCount = pendingCopyCounts[colorCode] ?? 0;
      if (pendingCount <= 0) return;

      setPendingCopyCounts((prev) => {
        const next = { ...prev };
        delete next[colorCode];
        return next;
      });

      const currentIndex = filtered.findIndex(
        (color) => color.code === colorCode,
      );
      const nextCounts: CopyCounts = {
        ...copyCounts,
        [colorCode]: (copyCounts[colorCode] ?? 0) + pendingCount,
      };
      const nextFiltered = getFilteredColors(
        colors,
        search,
        activeCategories,
        nextCounts,
      );
      const targetIndex = nextFiltered.findIndex(
        (color) => color.code === colorCode,
      );

      setCopyCounts(nextCounts);
      setMovingColorCode(colorCode);

      const sourceNode = swatchNodeRefs.current[colorCode];
      const sourceRect = sourceNode?.getBoundingClientRect();
      const movingColor = nextFiltered.find(
        (color) => color.code === colorCode,
      );

      const canUseFloatingMove =
        !floatingMove &&
        sourceRect !== undefined &&
        movingColor !== undefined &&
        currentIndex >= 0 &&
        targetIndex >= 0 &&
        currentIndex !== targetIndex;

      if (canUseFloatingMove) {
        setFloatingMove({
          colorCode,
          color: movingColor,
          targetIndex,
          fromRect: {
            top: sourceRect.top,
            left: sourceRect.left,
            width: sourceRect.width,
            height: sourceRect.height,
          },
          toRect: null,
        });
        return;
      }

      scheduleMovingIndicatorReset(850);
    },
    [
      pendingCopyCounts,
      filtered,
      copyCounts,
      colors,
      search,
      activeCategories,
      floatingMove,
      scheduleMovingIndicatorReset,
    ],
  );

  const currentOrder = useMemo(
    () => filtered.map((color) => color.code),
    [filtered],
  );

  const previousIndexByName = (() => {
    const indexByName = new Map<ColorCode, number>();
    previousOrderRef.current.forEach((name, index) => {
      indexByName.set(name, index);
    });
    return indexByName;
  })();

  const reorderDelayByName = useMemo(() => {
    const delays = new Map<ColorCode, number>();
    if (!movingColorCode) return delays;

    const previousOrder = previousOrderRef.current;
    if (
      previousOrder.length !== currentOrder.length ||
      currentOrder.length === 0
    ) {
      return delays;
    }

    for (const name of currentOrder) {
      if (!previousIndexByName.has(name)) return delays;
    }

    const movedPrevIndex = previousIndexByName.get(movingColorCode);
    const movedNextIndex = currentOrder.indexOf(movingColorCode);

    if (
      movedPrevIndex === undefined ||
      movedNextIndex < 0 ||
      movedPrevIndex === movedNextIndex
    ) {
      return delays;
    }

    if (movedPrevIndex > movedNextIndex) {
      // Moving up: animate neighbors below the old slot first, then propagate upward.
      currentOrder.forEach((name) => {
        if (name === movingColorCode) return;
        const prevIndex = previousIndexByName.get(name);
        if (prevIndex === undefined) return;
        if (prevIndex >= movedNextIndex && prevIndex < movedPrevIndex) {
          const step = movedPrevIndex - 1 - prevIndex;
          delays.set(
            name,
            Math.min(step * REORDER_STAGGER_STEP, REORDER_STAGGER_MAX),
          );
        }
      });
    } else {
      // Moving down: animate neighbors above the old slot first, then propagate downward.
      currentOrder.forEach((name) => {
        if (name === movingColorCode) return;
        const prevIndex = previousIndexByName.get(name);
        if (prevIndex === undefined) return;
        if (prevIndex > movedPrevIndex && prevIndex <= movedNextIndex) {
          const step = prevIndex - (movedPrevIndex + 1);
          delays.set(
            name,
            Math.min(step * REORDER_STAGGER_STEP, REORDER_STAGGER_MAX),
          );
        }
      });
    }

    return delays;
  }, [movingColorCode, currentOrder, previousIndexByName]);

  const gridTokens = useMemo<GridToken[]>(() => {
    if (!floatingMove) {
      return filtered.map((color) => ({ kind: "color", color }));
    }

    const withoutMoving = filtered.filter(
      (color) => color.code !== floatingMove.colorCode,
    );
    const insertIndex = Math.max(
      0,
      Math.min(floatingMove.targetIndex, withoutMoving.length),
    );
    const tokens = withoutMoving.map(
      (color) => ({ kind: "color", color }) as GridToken,
    );
    tokens.splice(insertIndex, 0, {
      kind: "placeholder",
      key: `floating-placeholder-${floatingMove.colorCode}`,
    });
    return tokens;
  }, [filtered, floatingMove]);

  const floatingMoveDuration = useMemo(() => {
    if (!floatingMove?.toRect) return FLOAT_MOVE_MIN_DURATION;

    const dx = floatingMove.toRect.left - floatingMove.fromRect.left;
    const dy = floatingMove.toRect.top - floatingMove.fromRect.top;
    const distance = Math.hypot(dx, dy);
    const duration = distance / FLOAT_MOVE_PIXELS_PER_SECOND;

    return Math.min(
      FLOAT_MOVE_MAX_DURATION,
      Math.max(FLOAT_MOVE_MIN_DURATION, duration),
    );
  }, [floatingMove]);

  useEffect(() => {
    if (!floatingMove || floatingMove.toRect) return;

    const placeholderNode = placeholderRef.current;
    if (!placeholderNode) return;

    const animationFrame = window.requestAnimationFrame(() => {
      const rect = placeholderNode.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      setFloatingMove((current) => {
        if (!current || current.toRect) return current;
        return {
          ...current,
          toRect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        };
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [floatingMove, gridTokens]);

  useEffect(() => {
    previousOrderRef.current = currentOrder;
  }, [currentOrder]);

  const searchFilter = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={t("colors.searchPlaceholder", { total: colors.length })}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label={t("colors.searchPlaceholder", { total: colors.length })}
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
          onClick={() => setSearch("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={t("colors.clearSearchAria")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const categoryFilters = (
    <div className="flex flex-col gap-1">
      {categoryFiltersList.map((category) => {
        const isActive = activeCategories.has(category.code);
        const count = categoryCountsByCode.get(category.code) ?? 0;
        return (
          <button
            key={category.code}
            type="button"
            onClick={() => toggleCategory(category.code)}
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
        filtered: filtered.length,
        total: colors.length,
      })}
    </div>
  );

  const filters = (
    <>
      {searchFilter}
      {categoryFilters}
      {resultsSummary}
    </>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
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
              {categoryFilters}
              {resultsSummary}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 min-w-0">{searchFilter}</div>
      </div>

      <div className="hidden md:flex md:w-56 shrink-0 flex-col gap-3">
        {filters}
      </div>

      <div className="flex-1 min-w-0">
        {topContent ? <div className="mb-2">{topContent}</div> : null}
        <div className="mb-2 font-mono text-[9px] leading-tight text-orange-400/90">
          {t("header.manualInstruction")}
        </div>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {gridTokens.map((token) => {
            if (token.kind === "placeholder") {
              return (
                <motion.div
                  key={token.key}
                  className="w-full"
                  layout="position"
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 180,
                      damping: 32,
                      mass: 0.9,
                    },
                  }}
                >
                  <div
                    ref={placeholderRef}
                    className="w-full aspect-[5/3]"
                    aria-hidden="true"
                  />
                </motion.div>
              );
            }

            const { color } = token;
            return (
              <motion.div
                key={color.code}
                ref={(node) => {
                  if (node) swatchNodeRefs.current[color.code] = node;
                  else delete swatchNodeRefs.current[color.code];
                }}
                className="w-full"
                layout="position"
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 180,
                    damping: 32,
                    mass: 0.9,
                    delay: reorderDelayByName.get(color.code) ?? 0,
                  },
                  scale: { duration: 0.22, ease: "easeOut" },
                }}
                animate={
                  movingColorCode === color.code
                    ? { scale: [1, 1.035, 1] }
                    : { scale: 1 }
                }
              >
                <ColorSwatch
                  color={color}
                  mode={swatchMode}
                  copyCount={
                    (copyCounts[color.code] ?? 0) +
                    (pendingCopyCounts[color.code] ?? 0)
                  }
                  onCopy={() => queueCopyCount(color.code)}
                  onSwatchLeave={() => flushQueuedCopyCount(color.code)}
                  isReordering={movingColorCode === color.code && !floatingMove}
                />
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 font-mono text-muted-foreground text-[13px]">
            {t("colors.noData")}
          </div>
        )}
      </div>
      {floatingMove && (
        <motion.div
          className="pointer-events-none z-50"
          style={{
            position: "fixed",
            top: floatingMove.fromRect.top,
            left: floatingMove.fromRect.left,
            width: floatingMove.fromRect.width,
            transformOrigin: "top left",
          }}
          initial={false}
          animate={
            floatingMove.toRect
              ? {
                  x: floatingMove.toRect.left - floatingMove.fromRect.left,
                  y: floatingMove.toRect.top - floatingMove.fromRect.top,
                }
              : { x: 0, y: 0 }
          }
          transition={
            floatingMove.toRect
              ? {
                  duration: floatingMoveDuration,
                  ease: "easeIn",
                }
              : { duration: 0 }
          }
          onAnimationComplete={() => {
            if (!floatingMove.toRect) return;
            setFloatingMove(null);
            setMovingColorCode(null);
          }}
        >
          <ColorSwatch
            color={floatingMove.color}
            mode={swatchMode}
            copyCount={copyCounts[floatingMove.colorCode] ?? 0}
            isReordering
          />
        </motion.div>
      )}
    </div>
  );
};

export default ColorsTab;
