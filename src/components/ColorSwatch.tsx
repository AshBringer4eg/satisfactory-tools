import { useState, useCallback } from "react";
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
  const [hovered, setHovered] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(color.hex);
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [color.hex, onCopy]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    onSwatchLeave?.();
  }, [onSwatchLeave]);

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full flex flex-col overflow-hidden text-left transition-all duration-150 cursor-pointer group"
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
          className="absolute right-2 top-2 px-2 py-0.5 text-[12px] font-semibold text-white bg-black/35 rounded-[2px]"
        >
          {copyCount}x
        </div>
        <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 flex flex-col gap-0.5">
          <span
            className="text-[15px] font-semibold tracking-normal text-white leading-tight truncate"
          >
            {color.name}
          </span>
          <span
            className="text-[14px] font-medium tracking-normal text-white"
          >
            {hovered && !copied ? (
              <span className="text-primary">COPY</span>
            ) : copied ? (
              <span className="text-accent">COPIED</span>
            ) : (
              color.hex
            )}
          </span>
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
