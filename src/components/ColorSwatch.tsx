import { useState, useCallback, useEffect, useRef } from "react";
import type { SatisfactoryColor } from "@/data/colors";
import { t } from "@/i18n";
import { AppTabId } from "@/config/tabs";

interface ColorSwatchProps {
  color: SatisfactoryColor;
  copyCount: number;
  onCopy?: () => void;
  onSwatchLeave?: () => void;
  isReordering?: boolean;
  mode?: AppTabId;
}

type SwatchPart = "primary" | "secondary";

const ColorSwatch = ({
  color,
  copyCount,
  onCopy,
  onSwatchLeave,
  isReordering = false,
  mode = "solo",
}: ColorSwatchProps) => {
  const [copiedPart, setCopiedPart] = useState<SwatchPart | null>(null);
  const [copyFailedPart, setCopyFailedPart] = useState<SwatchPart | null>(null);
  const [hoveredPart, setHoveredPart] = useState<SwatchPart | null>(null);
  const feedbackResetTimeoutRef = useRef<number | null>(null);
  const isDuo = mode === "duo";

  const scheduleFeedbackReset = useCallback(() => {
    if (feedbackResetTimeoutRef.current !== null) {
      window.clearTimeout(feedbackResetTimeoutRef.current);
    }
    feedbackResetTimeoutRef.current = window.setTimeout(() => {
      setCopiedPart(null);
      setCopyFailedPart(null);
      feedbackResetTimeoutRef.current = null;
    }, 1400);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackResetTimeoutRef.current !== null) {
        window.clearTimeout(feedbackResetTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback((part: SwatchPart) => {
    const hexToCopy = part === "primary" ? color.hex : color.secondaryColor;
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopiedPart(null);
      setCopyFailedPart(part);
      scheduleFeedbackReset();
      return;
    }

    void navigator.clipboard.writeText(hexToCopy).then(
      () => {
        onCopy?.();
        setCopyFailedPart(null);
        setCopiedPart(part);
        scheduleFeedbackReset();
      },
      () => {
        setCopiedPart(null);
        setCopyFailedPart(part);
        scheduleFeedbackReset();
      },
    );
  }, [color.hex, color.secondaryColor, onCopy, scheduleFeedbackReset]);

  const handleMouseLeave = useCallback(() => {
    setHoveredPart(null);
    onSwatchLeave?.();
  }, [onSwatchLeave]);

  const handleHexClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    if (typeof window === "undefined") return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(event.currentTarget);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const getPartLabel = (part: SwatchPart) => {
    if (copiedPart === part) return t("swatch.copied");
    if (copyFailedPart === part) return t("swatch.selectHex");
    if (hoveredPart === part) return t("swatch.copy");
    return null;
  };

  const isPartActive = (part: SwatchPart) => (
    hoveredPart === part || copiedPart === part || copyFailedPart === part
  );
  const isSwatchHovered = hoveredPart !== null;
  const bottomTintStyle = {
    background: "linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0) 100%)",
  } as const;

  if (!isDuo) {
    return (
      <button
        type="button"
        onClick={() => handleCopy("primary")}
        onMouseEnter={() => setHoveredPart("primary")}
        onMouseLeave={handleMouseLeave}
        className="relative w-full flex flex-col overflow-hidden text-left transition-all duration-150 cursor-pointer group"
        aria-label={t("swatch.aria.copyHex", { hex: color.hex, name: color.name })}
        style={{
          borderRadius: "2px",
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        {copiedPart === "primary" && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px] animate-copy-flash z-10"
            style={{ backgroundColor: "hsl(190, 90%, 50%)" }}
          />
        )}
        <div
          className="relative w-full aspect-[5/3]"
          style={{ backgroundColor: color.hex }}
        >
          <div className="absolute inset-0 pointer-events-none" style={bottomTintStyle} />
          {isPartActive("primary") && (
            <div
              className="absolute left-2 top-2 z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-black/45 rounded-[2px] pointer-events-none"
              aria-hidden="true"
            >
              {getPartLabel("primary")}
            </div>
          )}
          <div className="absolute right-2 top-2 px-2 py-0.5 text-[12px] font-semibold text-white bg-black/35 rounded-[2px] pointer-events-none">
            {copyCount}x
          </div>
          <div className="absolute inset-x-0 px-3 pt-2 flex flex-col gap-0" style={{ bottom: "0.2rem" }}>
            <span className="text-[14px] font-semibold tracking-normal text-white leading-tight truncate">
              {color.name}
            </span>
            <code
              className="text-[13px] font-mono tracking-normal text-white select-text cursor-text"
              aria-label={t("swatch.aria.hexCode", { hex: color.hex, name: color.name })}
              onClick={handleHexClick}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {color.hex}
            </code>
          </div>
        </div>
        {(isSwatchHovered || isReordering) && (
          <div
            className={`absolute inset-0 pointer-events-none ${isReordering ? "animate-pulse" : ""}`}
            style={{
              border: isReordering ? "1px solid rgba(56, 189, 248, 0.85)" : "1px solid rgba(250, 149, 73, 0.5)",
              borderRadius: "2px",
            }}
          />
        )}
      </button>
    );
  }

  return (
    <div
      onMouseLeave={handleMouseLeave}
      className="relative w-full flex flex-col overflow-hidden text-left transition-all duration-150"
      style={{
        borderRadius: "2px",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.03)",
      }}
    >
      {copiedPart && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] animate-copy-flash z-20"
          style={{ backgroundColor: "hsl(190, 90%, 50%)" }}
        />
      )}

      <div className="relative w-full aspect-[5/3] flex">
        <button
          type="button"
          onMouseEnter={() => setHoveredPart("primary")}
          onClick={() => handleCopy("primary")}
          className="relative basis-[70%] grow-0 shrink-0 text-left overflow-hidden"
          style={{ backgroundColor: color.hex }}
          aria-label={t("swatch.aria.copyPrimaryHex", { hex: color.hex, name: color.name })}
        >
          <div className="absolute inset-0 pointer-events-none" style={bottomTintStyle} />
          {isPartActive("primary") && (
            <>
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
              <div
                className="absolute left-2 top-2 z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-black/45 rounded-[2px] pointer-events-none"
                aria-hidden="true"
              >
                {getPartLabel("primary")}
              </div>
            </>
          )}
          <div className="absolute left-3" style={{ bottom: "0.2rem" }}>
            <code
              className="text-[13px] font-mono tracking-normal text-white select-text cursor-text"
              aria-label={t("swatch.aria.primaryHexCode", { hex: color.hex, name: color.name })}
              onClick={handleHexClick}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {color.hex}
            </code>
          </div>
        </button>

        <button
          type="button"
          onMouseEnter={() => setHoveredPart("secondary")}
          onClick={() => handleCopy("secondary")}
          className="relative basis-[30%] grow-0 shrink-0 text-left overflow-hidden"
          style={{ backgroundColor: color.secondaryColor }}
          aria-label={t("swatch.aria.copySecondaryHex", { hex: color.secondaryColor, name: color.name })}
        >
          <div className="absolute inset-0 pointer-events-none" style={bottomTintStyle} />
          {isPartActive("secondary") && (
            <>
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
            </>
          )}
          <div className="absolute inset-x-0 px-1 overflow-hidden" style={{ bottom: "0.2rem" }}>
            <code
              className="block w-full truncate text-center text-[11px] font-mono tracking-tight text-white select-text cursor-text"
              aria-label={t("swatch.aria.secondaryHexCode", { hex: color.secondaryColor, name: color.name })}
              onClick={handleHexClick}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {color.secondaryColor}
            </code>
          </div>
        </button>

        <div className="absolute left-3 right-3 pointer-events-none" style={{ bottom: "1.6rem" }}>
          <span className="text-[14px] font-semibold tracking-normal text-white leading-tight truncate block">
            {color.name}
          </span>
        </div>

        {isPartActive("secondary") ? (
          <div
            className="absolute right-2 top-2 z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-black/45 rounded-[2px] pointer-events-none"
            aria-hidden="true"
          >
            {getPartLabel("secondary")}
          </div>
        ) : (
          <div
            className="absolute right-2 top-2 px-2 py-0.5 text-[12px] font-semibold text-white bg-black/35 rounded-[2px] pointer-events-none z-10"
          >
            {copyCount}x
          </div>
        )}
      </div>

      {(isSwatchHovered || isReordering) && (
        <div
          className={`absolute inset-0 pointer-events-none ${isReordering ? "animate-pulse" : ""}`}
          style={{
            border: isReordering ? "1px solid rgba(56, 189, 248, 0.85)" : "1px solid rgba(250, 149, 73, 0.5)",
            borderRadius: "2px",
          }}
        />
      )}
    </div>
  );
};

export default ColorSwatch;
