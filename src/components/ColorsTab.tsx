import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import { colorPalettes, type SatisfactoryColor } from "@/data/colors";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ColorSwatch from "./ColorSwatch";

const COPY_COUNTS_STORAGE_KEY = "ficsit-color-copy-counts";
const RESET_COPY_COUNTS_EVENT = "ficsit:reset-copy-counters";
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
  colorName: string;
  color: SatisfactoryColor;
  targetIndex: number;
  fromRect: Rect;
  toRect: Rect | null;
};
type GridToken =
  | { kind: "color"; color: SatisfactoryColor }
  | { kind: "placeholder"; key: string };

const readCopyCounts = (): CopyCounts => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(COPY_COUNTS_STORAGE_KEY);
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

const defaultPalette = colorPalettes.default;
const categories = defaultPalette.categories;
const colors = defaultPalette.colors;
const getFilteredColors = (search: string, activeCategories: Set<string>, counts: CopyCounts) =>
  colors
    .filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.hex.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategories.size === 0 || c.categories.some((cat) => activeCategories.has(cat));
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const byCount = (counts[b.name] ?? 0) - (counts[a.name] ?? 0);
      if (byCount !== 0) return byCount;
      return a.name.localeCompare(b.name);
    });

const ColorsTab = () => {
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [copyCounts, setCopyCounts] = useState<CopyCounts>(() => readCopyCounts());
  const [pendingCopyCounts, setPendingCopyCounts] = useState<CopyCounts>({});
  const [movingColorName, setMovingColorName] = useState<string | null>(null);
  const [floatingMove, setFloatingMove] = useState<FloatingMove | null>(null);
  const movingIndicatorTimeoutRef = useRef<number | null>(null);
  const previousOrderRef = useRef<string[]>([]);
  const swatchNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(COPY_COUNTS_STORAGE_KEY, JSON.stringify(copyCounts));
    } catch {
      // Ignore storage write failures (private mode / quota restrictions).
    }
  }, [copyCounts]);

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
      setMovingColorName(null);
      movingIndicatorTimeoutRef.current = null;
    }, delay);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResetCounters = () => {
      setCopyCounts({});
      setPendingCopyCounts({});
      setMovingColorName(null);
      setFloatingMove(null);
      try {
        window.localStorage.removeItem(COPY_COUNTS_STORAGE_KEY);
      } catch {
        // Ignore storage failures.
      }
    };

    window.addEventListener(RESET_COPY_COUNTS_EVENT, handleResetCounters);
    return () => window.removeEventListener(RESET_COPY_COUNTS_EVENT, handleResetCounters);
  }, []);

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const queueCopyCount = useCallback((colorName: string) => {
    setPendingCopyCounts((prev) => ({
      ...prev,
      [colorName]: (prev[colorName] ?? 0) + 1,
    }));
  }, []);

  const filtered = useMemo(() => getFilteredColors(search, activeCategories, copyCounts), [search, activeCategories, copyCounts]);

  const flushQueuedCopyCount = useCallback(
    (colorName: string) => {
      const pendingCount = pendingCopyCounts[colorName] ?? 0;
      if (pendingCount <= 0) return;

      setPendingCopyCounts((prev) => {
        const next = { ...prev };
        delete next[colorName];
        return next;
      });

      const currentIndex = filtered.findIndex((color) => color.name === colorName);
      const nextCounts: CopyCounts = {
        ...copyCounts,
        [colorName]: (copyCounts[colorName] ?? 0) + pendingCount,
      };
      const nextFiltered = getFilteredColors(search, activeCategories, nextCounts);
      const targetIndex = nextFiltered.findIndex((color) => color.name === colorName);

      setCopyCounts(nextCounts);
      setMovingColorName(colorName);

      const sourceNode = swatchNodeRefs.current[colorName];
      const sourceRect = sourceNode?.getBoundingClientRect();
      const movingColor = nextFiltered.find((color) => color.name === colorName);

      const canUseFloatingMove = !floatingMove
        && sourceRect !== undefined
        && movingColor !== undefined
        && currentIndex >= 0
        && targetIndex >= 0
        && currentIndex !== targetIndex;

      if (canUseFloatingMove) {
        setFloatingMove({
          colorName,
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
    [pendingCopyCounts, filtered, copyCounts, search, activeCategories, floatingMove, scheduleMovingIndicatorReset],
  );

  const currentOrder = useMemo(() => filtered.map((color) => color.name), [filtered]);

  const previousIndexByName = (() => {
    const indexByName = new Map<string, number>();
    previousOrderRef.current.forEach((name, index) => {
      indexByName.set(name, index);
    });
    return indexByName;
  })();

  const reorderDelayByName = useMemo(() => {
    const delays = new Map<string, number>();
    if (!movingColorName) return delays;

    const previousOrder = previousOrderRef.current;
    if (previousOrder.length !== currentOrder.length || currentOrder.length === 0) {
      return delays;
    }

    for (const name of currentOrder) {
      if (!previousIndexByName.has(name)) return delays;
    }

    const movedPrevIndex = previousIndexByName.get(movingColorName);
    const movedNextIndex = currentOrder.indexOf(movingColorName);

    if (movedPrevIndex === undefined || movedNextIndex < 0 || movedPrevIndex === movedNextIndex) {
      return delays;
    }

    if (movedPrevIndex > movedNextIndex) {
      // Moving up: animate neighbors below the old slot first, then propagate upward.
      currentOrder.forEach((name) => {
        if (name === movingColorName) return;
        const prevIndex = previousIndexByName.get(name);
        if (prevIndex === undefined) return;
        if (prevIndex >= movedNextIndex && prevIndex < movedPrevIndex) {
          const step = movedPrevIndex - 1 - prevIndex;
          delays.set(name, Math.min(step * REORDER_STAGGER_STEP, REORDER_STAGGER_MAX));
        }
      });
    } else {
      // Moving down: animate neighbors above the old slot first, then propagate downward.
      currentOrder.forEach((name) => {
        if (name === movingColorName) return;
        const prevIndex = previousIndexByName.get(name);
        if (prevIndex === undefined) return;
        if (prevIndex > movedPrevIndex && prevIndex <= movedNextIndex) {
          const step = prevIndex - (movedPrevIndex + 1);
          delays.set(name, Math.min(step * REORDER_STAGGER_STEP, REORDER_STAGGER_MAX));
        }
      });
    }

    return delays;
  }, [movingColorName, currentOrder, previousIndexByName]);

  const gridTokens = useMemo<GridToken[]>(() => {
    if (!floatingMove) {
      return filtered.map((color) => ({ kind: "color", color }));
    }

    const withoutMoving = filtered.filter((color) => color.name !== floatingMove.colorName);
    const insertIndex = Math.max(0, Math.min(floatingMove.targetIndex, withoutMoving.length));
    const tokens = withoutMoving.map((color) => ({ kind: "color", color } as GridToken));
    tokens.splice(insertIndex, 0, {
      kind: "placeholder",
      key: `floating-placeholder-${floatingMove.colorName}`,
    });
    return tokens;
  }, [filtered, floatingMove]);

  const floatingMoveDuration = useMemo(() => {
    if (!floatingMove?.toRect) return FLOAT_MOVE_MIN_DURATION;

    const dx = floatingMove.toRect.left - floatingMove.fromRect.left;
    const dy = floatingMove.toRect.top - floatingMove.fromRect.top;
    const distance = Math.hypot(dx, dy);
    const duration = distance / FLOAT_MOVE_PIXELS_PER_SECOND;

    return Math.min(FLOAT_MOVE_MAX_DURATION, Math.max(FLOAT_MOVE_MIN_DURATION, duration));
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
        placeholder={`Search ${colors.length} colours`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const categoryFilters = (
    <div className="flex flex-col gap-1">
      {categories.map((cat) => {
        const isActive = activeCategories.has(cat);
        const count = colors.filter((c) => c.categories.includes(cat)).length;
        return (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
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
            <span className="truncate">{cat}</span>
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
      {filtered.length} / {colors.length} RESULTS
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
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
              Categories
            </div>
            <div className="flex flex-col gap-3">
              {categoryFilters}
              {resultsSummary}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 min-w-0">{searchFilter}</div>
      </div>

      {/* Sidebar filters */}
      <div className="hidden md:flex md:w-56 shrink-0 flex-col gap-3">
        {filters}
      </div>

      {/* Color grid */}
      <div className="flex-1 min-w-0">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
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
                key={color.name}
                ref={(node) => {
                  if (node) swatchNodeRefs.current[color.name] = node;
                  else delete swatchNodeRefs.current[color.name];
                }}
                className="w-full"
                layout="position"
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 180,
                    damping: 32,
                    mass: 0.9,
                    delay: reorderDelayByName.get(color.name) ?? 0,
                  },
                  scale: { duration: 0.22, ease: "easeOut" },
                }}
                animate={movingColorName === color.name ? { scale: [1, 1.035, 1] } : { scale: 1 }}
              >
                <ColorSwatch
                  color={color}
                  copyCount={(copyCounts[color.name] ?? 0) + (pendingCopyCounts[color.name] ?? 0)}
                  onCopy={() => queueCopyCount(color.name)}
                  onSwatchLeave={() => flushQueuedCopyCount(color.name)}
                  isReordering={movingColorName === color.name && !floatingMove}
                />
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 font-mono text-muted-foreground text-[13px]">
            NO_DATA_FOUND: CHECK_FILTERS
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
          animate={floatingMove.toRect
            ? {
              x: floatingMove.toRect.left - floatingMove.fromRect.left,
              y: floatingMove.toRect.top - floatingMove.fromRect.top,
            }
            : { x: 0, y: 0 }}
          transition={floatingMove.toRect
            ? {
              duration: floatingMoveDuration,
              ease: "easeIn",
            }
            : { duration: 0 }}
          onAnimationComplete={() => {
            if (!floatingMove.toRect) return;
            setFloatingMove(null);
            setMovingColorName(null);
          }}
        >
          <ColorSwatch
            color={floatingMove.color}
            copyCount={copyCounts[floatingMove.colorName] ?? 0}
            isReordering
          />
        </motion.div>
      )}
    </div>
  );
};

export default ColorsTab;
