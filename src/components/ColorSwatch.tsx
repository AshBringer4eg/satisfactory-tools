import { useState, useCallback, useEffect, useRef } from "react";
import type { SatisfactoryColor } from "@/data/colors";

interface ColorSwatchProps {
  color: SatisfactoryColor;
  copyCount: number;
  onCopy?: () => void;
  onSwatchLeave?: () => void;
  isReordering?: boolean;
}

const ColorSwatch = ({ color, copyCount, onCopy, onSwatchLeave, isReordering = false }: ColorSwatchProps) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const feedbackResetTimeoutRef = useRef<number | null>(null);

  const scheduleFeedbackReset = useCallback(() => {
    if (feedbackResetTimeoutRef.current !== null) {
      window.clearTimeout(feedbackResetTimeoutRef.current);
    }
    feedbackResetTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
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

  const handleCopy = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopied(false);
      setCopyFailed(true);
      scheduleFeedbackReset();
      return;
    }

    void navigator.clipboard.writeText(color.hex).then(
      () => {
        onCopy?.();
        setCopyFailed(false);
        setCopied(true);
        scheduleFeedbackReset();
      },
      () => {
        setCopied(false);
        setCopyFailed(true);
        scheduleFeedbackReset();
      },
    );
  }, [color.hex, onCopy, scheduleFeedbackReset]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
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

  const copyLabel = copied ? "COPIED" : copyFailed ? "SELECT HEX" : "COPY";

  return (
    <button
      type="button"
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full flex flex-col overflow-hidden text-left transition-all duration-150 cursor-pointer group"
      aria-label={`Copy hex code ${color.hex} for ${color.name}`}
      style={{
        borderRadius: "2px",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.03)",
      }}
    >
      {/* Copy flash bar */}
      {copied && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] animate-copy-flash z-10"
          style={{ backgroundColor: "hsl(190, 90%, 50%)" }}
        />
      )}

      {/* Color area */}
      <div
        className="relative w-full aspect-[5/3]"
        style={{ backgroundColor: color.hex }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <div
          className="absolute left-2 top-2 z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-black/45 rounded-[2px] pointer-events-none"
          aria-hidden="true"
        >
          {copyLabel}
        </div>
        <div
          className="absolute right-2 top-2 px-2 py-0.5 text-[12px] font-semibold text-white bg-black/35 rounded-[2px] pointer-events-none"
        >
          {copyCount}x
        </div>
        <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 flex flex-col gap-0.5">
          <span
            className="text-[15px] font-semibold tracking-normal text-white leading-tight truncate"
          >
            {color.name}
          </span>
          <code
            className="text-[14px] font-mono tracking-normal text-white select-text cursor-text"
            aria-label={`${color.name} hex code ${color.hex}`}
            onClick={handleHexClick}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {color.hex}
          </code>
        </div>
      </div>

      {/* Hover border */}
      {(hovered || isReordering) && (
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
};

export default ColorSwatch;
