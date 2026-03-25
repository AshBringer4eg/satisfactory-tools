import { useCallback, useEffect, useState } from "react";
import type { ColorCode } from "@/data/colors";
import { RESET_COPY_COUNTS_EVENT } from "@/config/storage";
import { getFilteredColors, type IndexedSearchColor } from "./filtering";
import type { CopyCounts, ReorderCommit } from "./types";

interface UseColorCopyCountsParams {
  storageKey: string;
  indexedColors: IndexedSearchColor[];
  searchQuery: string;
  activeCategoryCodes: Set<string>;
  onCopyCountCommitted?: (event: ReorderCommit) => void;
  onReset?: () => void;
}

interface UseColorCopyCountsResult {
  copyCounts: CopyCounts;
  pendingCopyCounts: CopyCounts;
  queueCopyCount: (colorCode: ColorCode) => void;
  flushQueuedCopyCount: (colorCode: ColorCode) => void;
}

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

export const useColorCopyCounts = ({
  storageKey,
  indexedColors,
  searchQuery,
  activeCategoryCodes,
  onCopyCountCommitted,
  onReset,
}: UseColorCopyCountsParams): UseColorCopyCountsResult => {
  const [copyCounts, setCopyCounts] = useState<CopyCounts>(() =>
    readCopyCounts(storageKey),
  );
  const [pendingCopyCounts, setPendingCopyCounts] = useState<CopyCounts>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(copyCounts));
    } catch {
      // Ignore storage write failures (private mode / quota restrictions).
    }
  }, [copyCounts, storageKey]);

  useEffect(() => {
    setCopyCounts(readCopyCounts(storageKey));
    setPendingCopyCounts({});
    onReset?.();
  }, [storageKey, onReset]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResetCounters = () => {
      setCopyCounts({});
      setPendingCopyCounts({});
      onReset?.();
    };

    window.addEventListener(RESET_COPY_COUNTS_EVENT, handleResetCounters);
    return () =>
      window.removeEventListener(RESET_COPY_COUNTS_EVENT, handleResetCounters);
  }, [onReset]);

  const queueCopyCount = useCallback((colorCode: ColorCode) => {
    setPendingCopyCounts((previous) => ({
      ...previous,
      [colorCode]: (previous[colorCode] ?? 0) + 1,
    }));
  }, []);

  const flushQueuedCopyCount = useCallback(
    (colorCode: ColorCode) => {
      const pendingCount = pendingCopyCounts[colorCode] ?? 0;
      if (pendingCount <= 0) return;

      setPendingCopyCounts((previous) => {
        const next = { ...previous };
        delete next[colorCode];
        return next;
      });

      const currentFiltered = getFilteredColors(
        indexedColors,
        searchQuery,
        activeCategoryCodes,
        copyCounts,
      );
      const sourceIndex = currentFiltered.findIndex(
        (color) => color.code === colorCode,
      );
      const nextCounts: CopyCounts = {
        ...copyCounts,
        [colorCode]: (copyCounts[colorCode] ?? 0) + pendingCount,
      };
      const nextFiltered = getFilteredColors(
        indexedColors,
        searchQuery,
        activeCategoryCodes,
        nextCounts,
      );
      const targetIndex = nextFiltered.findIndex(
        (color) => color.code === colorCode,
      );
      const movedColor = nextFiltered.find((color) => color.code === colorCode);

      setCopyCounts(nextCounts);

      if (
        movedColor &&
        sourceIndex >= 0 &&
        targetIndex >= 0 &&
        sourceIndex !== targetIndex
      ) {
        onCopyCountCommitted?.({
          colorCode,
          color: movedColor,
          sourceIndex,
          targetIndex,
        });
      }
    },
    [
      pendingCopyCounts,
      indexedColors,
      searchQuery,
      activeCategoryCodes,
      copyCounts,
      onCopyCountCommitted,
    ],
  );

  return {
    copyCounts,
    pendingCopyCounts,
    queueCopyCount,
    flushQueuedCopyCount,
  };
};
