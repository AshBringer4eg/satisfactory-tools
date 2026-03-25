import { motion } from "framer-motion";
import ColorSwatch from "@/components/ColorSwatch";
import type { CopyCounts, FloatingMove } from "./types";

interface ColorsTabFloatingSwatchProps {
  floatingMove: FloatingMove | null;
  swatchMode: "solo" | "duo";
  copyCounts: CopyCounts;
  floatingMoveDuration: number;
  onAnimationComplete: () => void;
}

const ColorsTabFloatingSwatch = ({
  floatingMove,
  swatchMode,
  copyCounts,
  floatingMoveDuration,
  onAnimationComplete,
}: ColorsTabFloatingSwatchProps) => {
  if (!floatingMove) return null;

  return (
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
      onAnimationComplete={onAnimationComplete}
    >
      <ColorSwatch
        color={floatingMove.color}
        mode={swatchMode}
        copyCount={copyCounts[floatingMove.colorCode] ?? 0}
        isReordering
      />
    </motion.div>
  );
};

export default ColorsTabFloatingSwatch;
