import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Menu, Search } from "lucide-react";
import { colorPalettes } from "@/data/colors";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ColorSwatch from "./ColorSwatch";

const COPY_COUNTS_STORAGE_KEY = "ficsit-color-copy-counts";
const RESET_COPY_COUNTS_EVENT = "ficsit:reset-copy-counters";

type CopyCounts = Record<string, number>;

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

const ColorsTab = () => {
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [copyCounts, setCopyCounts] = useState<CopyCounts>(() => readCopyCounts());
  const [pendingCopyCounts, setPendingCopyCounts] = useState<CopyCounts>({});
  const [movingColorName, setMovingColorName] = useState<string | null>(null);
  const movingIndicatorTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResetCounters = () => {
      setCopyCounts({});
      setPendingCopyCounts({});
      setMovingColorName(null);
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

  const flushQueuedCopyCount = useCallback(
    (colorName: string) => {
      const pendingCount = pendingCopyCounts[colorName] ?? 0;
      if (pendingCount <= 0) return;

      setPendingCopyCounts((prev) => {
        const next = { ...prev };
        delete next[colorName];
        return next;
      });

      setCopyCounts((prev) => ({
        ...prev,
        [colorName]: (prev[colorName] ?? 0) + pendingCount,
      }));

      setMovingColorName(colorName);
      if (movingIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(movingIndicatorTimeoutRef.current);
      }
      movingIndicatorTimeoutRef.current = window.setTimeout(() => {
        setMovingColorName((current) => (current === colorName ? null : current));
        movingIndicatorTimeoutRef.current = null;
      }, 700);
    },
    [pendingCopyCounts],
  );

  const filtered = useMemo(() => {
    return colors
      .filter((c) => {
        const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.hex.toLowerCase().includes(search.toLowerCase());
        const matchCat = activeCategories.size === 0 || c.categories.some((cat) => activeCategories.has(cat));
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        const byCount = (copyCounts[b.name] ?? 0) - (copyCounts[a.name] ?? 0);
        if (byCount !== 0) return byCount;
        return a.name.localeCompare(b.name);
      });
  }, [search, activeCategories, copyCounts]);

  const filters = (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search ${colors.length} colours`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface pl-10 pr-3 py-2 text-[13px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          style={{
            borderRadius: "2px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      </div>

      {/* Categories */}
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

      <div className="text-muted-foreground text-[11px] font-mono mt-2 px-3">
        {filtered.length} / {colors.length} RESULTS
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-foreground border border-border bg-surface"
              style={{ borderRadius: "2px" }}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
              Search & Categories
            </div>
            <div className="flex flex-col gap-3">{filters}</div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sidebar filters */}
      <div className="hidden md:flex md:w-56 shrink-0 flex-col gap-3">
        {filters}
      </div>

      {/* Color grid */}
      <div className="flex-1 min-w-0">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {filtered.map((color) => (
            <motion.div
              key={color.name}
              className="w-full"
              layout
              transition={{ type: "spring", stiffness: 360, damping: 32, mass: 0.45 }}
              animate={movingColorName === color.name ? { scale: [1, 1.035, 1] } : { scale: 1 }}
            >
              <ColorSwatch
                color={color}
                copyCount={(copyCounts[color.name] ?? 0) + (pendingCopyCounts[color.name] ?? 0)}
                onCopy={() => queueCopyCount(color.name)}
                onSwatchLeave={() => flushQueuedCopyCount(color.name)}
                isReordering={movingColorName === color.name}
              />
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 font-mono text-muted-foreground text-[13px]">
            NO_DATA_FOUND: CHECK_FILTERS
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorsTab;
