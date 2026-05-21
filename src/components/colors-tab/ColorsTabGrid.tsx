import { motion } from "framer-motion";
import type { MutableRefObject } from "react";
import type { ColorCode } from "@/data/colors";
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
  placeholderRef: MutableRefObject<HTMLDivElement | null>;
  registerSwatchNode: (colorCode: ColorCode, node: HTMLDivElement | null) => void;
  onCopy: (colorCode: ColorCode) => void;
  onSwatchLeave: (colorCode: ColorCode) => void;
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
  placeholderRef,
  registerSwatchNode,
  onCopy,
  onSwatchLeave,
}: ColorsTabGridProps) => {
  return (
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
            ref={(node) => registerSwatchNode(color.code, node)}
            className="w-full"
            layout="position"
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
              isReordering={movingColorCode === color.code && !floatingMove}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default ColorsTabGrid;
