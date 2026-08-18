import type { CSSProperties } from "react";
import type { SwatchOverlayToken } from "@/lib/color-accessibility";
import { cn } from "@/lib/utils";

interface SwatchAssistOverlayProps {
  token: SwatchOverlayToken;
  showPattern: boolean;
  showSymbol: boolean;
  presentation?: "full" | "compact";
}

const getPatternStyle = (
  pattern: SwatchOverlayToken["pattern"],
  presentation: "full" | "compact",
): CSSProperties => {
  const white = "rgba(255, 255, 255, 0.42)";
  const black = "rgba(0, 0, 0, 0.2)";
  const stripeEnd = presentation === "compact" ? "6px" : "9px";
  const patternSize = presentation === "compact" ? "6px 6px" : "10px 10px";

  switch (pattern) {
    case "diagonal":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${white} 0 1px, transparent 1px ${stripeEnd})`,
      };
    case "backslash":
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${white} 0 1px, transparent 1px ${stripeEnd})`,
      };
    case "horizontal":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${black} 0 2px, transparent 2px ${presentation === "compact" ? "7px" : "10px"})`,
      };
    case "vertical":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${white} 0 1px, transparent 1px ${stripeEnd})`,
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${white} 1px, transparent 1px), linear-gradient(90deg, ${white} 1px, transparent 1px)`,
        backgroundSize: patternSize,
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(circle at center, ${white} 1px, transparent 1.5px)`,
        backgroundSize: patternSize,
      };
    default:
      return {};
  }
};

const SwatchAssistOverlay = ({
  token,
  showPattern,
  showSymbol,
  presentation = "full",
}: SwatchAssistOverlayProps) => (
  <>
    {showPattern && (
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-55 mix-blend-overlay"
        style={getPatternStyle(token.pattern, presentation)}
        aria-hidden="true"
        data-testid="swatch-pattern-overlay"
      />
    )}
    {showSymbol && (
      <div
        className={cn(
          "absolute inset-0 z-[2] grid place-items-center pointer-events-none font-mono font-bold leading-none text-white",
          presentation === "compact" ? "text-[14px]" : "text-[38px]",
        )}
        aria-hidden="true"
        data-testid="swatch-symbol-overlay"
      >
        {token.symbol}
      </div>
    )}
  </>
);

export default SwatchAssistOverlay;
