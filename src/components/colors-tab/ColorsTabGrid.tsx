import { motion } from "framer-motion";
import { useCallback, useRef, type MutableRefObject } from "react";
import type { ColorCode, SatisfactoryColor } from "@/data/colors";
import ColorSwatch from "@/components/ColorSwatch";
import type { ShareCardMode } from "@/lib/share-links";
import type { CopyCounts, FloatingMove, GridToken } from "./types";

interface ColorsTabGridProps {
  gridTokens: GridToken[];
  swatchMode: "solo" | "duo";
  shareMode: ShareCardMode | null;
  copyCounts: CopyCounts;
  pendingCopyCounts: CopyCounts;
  movingColorCode: ColorCode | null;
  floatingMove: FloatingMove | null;
  reorderDelayByCode: Map<ColorCode, number>;
  highlightFilteringResult: boolean;
  filteringResultAnchor: "filtering-results-grid" | "filtering-filtered-swatches";
  trackFilteringResultLayout: boolean;
  filteringAnimationKey: string;
  onFilteringAnimationStart: () => void;
  onFilteringAnimationComplete: () => void;
  placeholderRef: MutableRefObject<HTMLDivElement | null>;
  registerSwatchNode: (colorCode: ColorCode, node: HTMLDivElement | null) => void;
  onCopy: (colorCode: ColorCode) => void;
  onSwatchLeave: (colorCode: ColorCode) => void;
  onHarmonyOpen: (color: SatisfactoryColor) => void;
}

const ColorsTabGrid = ({
  gridTokens,
  swatchMode,
  shareMode,
  copyCounts,
  pendingCopyCounts,
  movingColorCode,
  floatingMove,
  reorderDelayByCode,
  highlightFilteringResult,
  filteringResultAnchor,
  trackFilteringResultLayout,
  filteringAnimationKey,
  onFilteringAnimationStart,
  onFilteringAnimationComplete,
  placeholderRef,
  registerSwatchNode,
  onCopy,
  onSwatchLeave,
  onHarmonyOpen,
}: ColorsTabGridProps) => {
  const activeFilteringAnimationsRef = useRef(new Set<string>());
  const filteringAnimationStartedRef = useRef(false);
  const previousFilteringAnimationKeyRef = useRef(filteringAnimationKey);
  const filteringAnimationKeyRef = useRef(filteringAnimationKey);

  if (previousFilteringAnimationKeyRef.current !== filteringAnimationKey) {
    activeFilteringAnimationsRef.current.clear();
    filteringAnimationStartedRef.current = false;
    previousFilteringAnimationKeyRef.current = filteringAnimationKey;
  }
  filteringAnimationKeyRef.current = filteringAnimationKey;

  const handleFilteringAnimationStart = useCallback(
    (itemKey: string) => {
      if (
        !trackFilteringResultLayout ||
        !filteringAnimationKey ||
        filteringAnimationKeyRef.current !== filteringAnimationKey
      ) {
        return;
      }

      if (activeFilteringAnimationsRef.current.size === 0) {
        filteringAnimationStartedRef.current = true;
        onFilteringAnimationStart();
      }
      activeFilteringAnimationsRef.current.add(itemKey);
    },
    [
      filteringAnimationKey,
      onFilteringAnimationStart,
      trackFilteringResultLayout,
    ],
  );

  const handleFilteringAnimationComplete = useCallback(
    (itemKey: string) => {
      if (
        !trackFilteringResultLayout ||
        !filteringAnimationKey ||
        filteringAnimationKeyRef.current !== filteringAnimationKey
      ) {
        return;
      }

      activeFilteringAnimationsRef.current.delete(itemKey);
      if (
        filteringAnimationStartedRef.current &&
        activeFilteringAnimationsRef.current.size === 0
      ) {
        filteringAnimationStartedRef.current = false;
        onFilteringAnimationComplete();
      }
    },
    [
      filteringAnimationKey,
      onFilteringAnimationComplete,
      trackFilteringResultLayout,
    ],
  );

  return (
    <div
      className="grid gap-2"
      data-tutorial={
        highlightFilteringResult ? filteringResultAnchor : "swatches-grid"
      }
      data-testid={highlightFilteringResult ? filteringResultAnchor : undefined}
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
              onLayoutAnimationStart={() =>
                handleFilteringAnimationStart(token.key)
              }
              onLayoutAnimationComplete={() =>
                handleFilteringAnimationComplete(token.key)
              }
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
            ref={(node) => registerSwatchNode(color.code, node)}
            className="w-full"
            data-color-code={color.code}
            layout="position"
            onLayoutAnimationStart={() =>
              handleFilteringAnimationStart(color.code)
            }
            onLayoutAnimationComplete={() =>
              handleFilteringAnimationComplete(color.code)
            }
            transition={{
              layout: {
                type: "spring",
                stiffness: 180,
                damping: 32,
                mass: 0.9,
                delay: reorderDelayByCode.get(color.code) ?? 0,
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
              shareMode={shareMode}
              copyCount={
                (copyCounts[color.code] ?? 0) + (pendingCopyCounts[color.code] ?? 0)
              }
              onCopy={() => onCopy(color.code)}
              onSwatchLeave={() => onSwatchLeave(color.code)}
              onHarmonyOpen={() => onHarmonyOpen(color)}
              isReordering={movingColorCode === color.code && !floatingMove}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default ColorsTabGrid;
