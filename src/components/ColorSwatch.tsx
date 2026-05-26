import { useState, useCallback, useEffect, useRef } from "react";
import { useColorAccessibility } from "@/components/accessibility/color-accessibility-context";
import SwatchAssistOverlay from "@/components/accessibility/SwatchAssistOverlay";
import type { SatisfactoryColor } from "@/data/colors";
import { t } from "@/i18n";
import { Palette, Share2 } from "lucide-react";
import {
  getSwatchOverlayToken,
  simulateHexColor,
} from "@/lib/color-accessibility";
import {
  getShareCardUrl,
  hasStaticShareCard,
  type ShareCardMode,
} from "@/lib/share-links";

interface ColorSwatchProps {
  color: SatisfactoryColor;
  copyCount: number;
  onCopy?: () => void;
  onSwatchLeave?: () => void;
  isReordering?: boolean;
  mode?: "solo" | "duo";
  shareMode?: ShareCardMode | null;
  onHarmonyOpen?: () => void;
}

type SwatchPart = "primary" | "secondary";
type ShareFeedback = "copied" | "failed";

const ColorSwatch = ({
  color,
  copyCount,
  onCopy,
  onSwatchLeave,
  isReordering = false,
  mode = "solo",
  shareMode = null,
  onHarmonyOpen,
}: ColorSwatchProps) => {
  const [copiedPart, setCopiedPart] = useState<SwatchPart | null>(null);
  const [copyFailedPart, setCopyFailedPart] = useState<SwatchPart | null>(null);
  const [hoveredPart, setHoveredPart] = useState<SwatchPart | null>(null);
  const [isActionHovered, setIsActionHovered] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<ShareFeedback | null>(null);
  const feedbackResetTimeoutRef = useRef<number | null>(null);
  const shareFeedbackResetTimeoutRef = useRef<number | null>(null);
  const [showActionsPersistently, setShowActionsPersistently] = useState(false);
  const isDuo = mode === "duo";
  const { settings } = useColorAccessibility();
  const primaryDisplayHex = simulateHexColor(color.hex, settings.visionMode);
  const secondaryDisplayHex = simulateHexColor(
    color.secondaryColor,
    settings.visionMode,
  );
  const primaryAssistToken = getSwatchOverlayToken(color.code, "primary");
  const secondaryAssistToken = getSwatchOverlayToken(color.code, "secondary");

  const scheduleShareFeedbackReset = useCallback(() => {
    if (shareFeedbackResetTimeoutRef.current !== null) {
      window.clearTimeout(shareFeedbackResetTimeoutRef.current);
    }
    shareFeedbackResetTimeoutRef.current = window.setTimeout(() => {
      setShareFeedback(null);
      shareFeedbackResetTimeoutRef.current = null;
    }, 1400);
  }, []);

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
      if (shareFeedbackResetTimeoutRef.current !== null) {
        window.clearTimeout(shareFeedbackResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const updateActionVisibility = () => {
      setShowActionsPersistently(mediaQuery.matches);
    };

    updateActionVisibility();
    mediaQuery.addEventListener("change", updateActionVisibility);

    return () => {
      mediaQuery.removeEventListener("change", updateActionVisibility);
    };
  }, []);

  const handleShareCopy = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.blur();
    setHoveredPart(null);

    if (!shareMode || typeof window === "undefined") return;

    const shareUrl = getShareCardUrl(color.code, shareMode);
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setShareFeedback("failed");
      scheduleShareFeedbackReset();
      return;
    }

    void navigator.clipboard.writeText(shareUrl).then(
      () => {
        setShareFeedback("copied");
        scheduleShareFeedbackReset();
      },
      () => {
        setShareFeedback("failed");
        scheduleShareFeedbackReset();
      },
    );
  }, [color.code, scheduleShareFeedbackReset, shareMode]);

  const handleHarmonyOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.blur();
    setHoveredPart(null);
    onHarmonyOpen?.();
  }, [onHarmonyOpen]);

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
    setIsActionHovered(false);
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
  const areActionsHovered = isSwatchHovered || isActionHovered;
  const bottomTintStyle = {
    background: "linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0) 100%)",
  } as const;
  const shareLabel = shareFeedback === "copied"
    ? t("swatch.shareCopied")
    : shareFeedback === "failed"
      ? t("swatch.shareFailed")
      : t("swatch.share");
  const canShare = shareMode !== null && hasStaticShareCard(color.code);
  const canOpenHarmony = Boolean(onHarmonyOpen);
  const copyLabelLeftClass = canShare || canOpenHarmony ? "left-11" : "left-2";
  const actionButtonVisibilityClass = showActionsPersistently
    ? "opacity-100 pointer-events-auto"
    : areActionsHovered
      ? "opacity-100 pointer-events-auto transition-opacity"
    : "opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto";
  const shareButton = canShare ? (
    <button
      type="button"
      onClick={handleShareCopy}
      onMouseEnter={() => {
        setIsActionHovered(true);
        setHoveredPart(null);
      }}
      onMouseLeave={() => setIsActionHovered(false)}
      aria-label={t("swatch.aria.copyShareLink", { name: color.name })}
      title={t("swatch.aria.copyShareLink", { name: color.name })}
      data-testid="swatch-share-link"
      className={`absolute left-2 top-2 z-50 inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-[2px] bg-black/50 px-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/70 ${actionButtonVisibilityClass}`}
    >
      <Share2 className="size-3.5" aria-hidden="true" />
      {shareFeedback ? <span>{shareLabel}</span> : null}
    </button>
  ) : null;
  const harmonyButton = canOpenHarmony ? (
    <button
      type="button"
      onClick={handleHarmonyOpen}
      onMouseEnter={() => {
        setIsActionHovered(true);
        setHoveredPart(null);
      }}
      onMouseLeave={() => setIsActionHovered(false)}
      aria-label={t("swatch.aria.openHarmony", { name: color.name })}
      title={t("swatch.aria.openHarmony", { name: color.name })}
      data-testid="swatch-harmony-open"
      className={`absolute left-2 ${canShare ? "top-10" : "top-2"} z-50 inline-flex h-7 w-7 items-center justify-center rounded-[2px] bg-black/50 text-white shadow-sm hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/70 ${actionButtonVisibilityClass}`}
    >
      <Palette className="size-3.5" aria-hidden="true" />
    </button>
  ) : null;
  const actionButtons = shareButton || harmonyButton ? (
    <>
      {shareButton}
      {harmonyButton}
    </>
  ) : null;

  if (!isDuo) {
    return (
      <div
        onMouseEnter={() => setHoveredPart("primary")}
        onMouseLeave={handleMouseLeave}
        className="group relative w-full flex flex-col overflow-hidden text-left transition-all duration-150"
        style={{
          borderRadius: "2px",
          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        <button
          type="button"
          onClick={() => handleCopy("primary")}
          onMouseEnter={() => setHoveredPart("primary")}
          onMouseLeave={handleMouseLeave}
          className="relative z-0 w-full flex flex-col text-left transition-all duration-150 cursor-pointer"
          aria-label={t("swatch.aria.copyHex", { hex: color.hex, name: color.name })}
        >
        {copiedPart === "primary" && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px] animate-copy-flash z-10"
            style={{ backgroundColor: "hsl(190, 90%, 50%)" }}
          />
        )}
        <div
          className="relative w-full aspect-[5/3]"
          style={{ backgroundColor: primaryDisplayHex }}
        >
          <div className="absolute inset-0 pointer-events-none" style={bottomTintStyle} />
          <SwatchAssistOverlay
            token={primaryAssistToken}
            showPattern={settings.showPatterns}
            showSymbol={settings.showSymbols}
          />
          {isPartActive("primary") && (
            <div
              className={`absolute ${copyLabelLeftClass} top-2 z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-black/45 rounded-[2px] pointer-events-none`}
              aria-hidden="true"
            >
              {getPartLabel("primary")}
            </div>
          )}
          <div className="absolute right-2 top-2 z-10 px-2 py-0.5 text-[12px] font-semibold text-white bg-black/35 rounded-[2px] pointer-events-none">
            {copyCount}x
          </div>
          <div className="absolute inset-x-0 z-10 px-3 pt-2 flex flex-col gap-0" style={{ bottom: "0.2rem" }}>
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
        </button>
        {actionButtons}
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
  }

  return (
    <div
      onMouseEnter={() => setHoveredPart("primary")}
      onMouseLeave={handleMouseLeave}
      className="group relative w-full flex flex-col overflow-hidden text-left transition-all duration-150"
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
      {actionButtons}

      <div className="relative w-full aspect-[5/3] flex">
        <button
          type="button"
          onMouseEnter={() => setHoveredPart("primary")}
          onClick={() => handleCopy("primary")}
          className="relative z-0 basis-[70%] grow-0 shrink-0 text-left overflow-hidden"
          style={{ backgroundColor: primaryDisplayHex }}
          aria-label={t("swatch.aria.copyPrimaryHex", { hex: color.hex, name: color.name })}
        >
          <div className="absolute inset-0 pointer-events-none" style={bottomTintStyle} />
          <SwatchAssistOverlay
            token={primaryAssistToken}
            showPattern={settings.showPatterns}
            showSymbol={settings.showSymbols}
          />
          {isPartActive("primary") && (
            <>
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
              <div
                className={`absolute ${copyLabelLeftClass} top-2 z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-black/45 rounded-[2px] pointer-events-none`}
                aria-hidden="true"
              >
                {getPartLabel("primary")}
              </div>
            </>
          )}
          <div className="absolute left-3 z-10" style={{ bottom: "0.2rem" }}>
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
          className="relative z-0 basis-[30%] grow-0 shrink-0 text-left overflow-hidden"
          style={{ backgroundColor: secondaryDisplayHex }}
          aria-label={t("swatch.aria.copySecondaryHex", { hex: color.secondaryColor, name: color.name })}
        >
          <div className="absolute inset-0 pointer-events-none" style={bottomTintStyle} />
          <SwatchAssistOverlay
            token={secondaryAssistToken}
            showPattern={settings.showPatterns}
            showSymbol={settings.showSymbols}
          />
          {isPartActive("secondary") && (
            <>
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
            </>
          )}
          <div className="absolute inset-x-0 z-10 px-1 overflow-hidden" style={{ bottom: "0.2rem" }}>
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

        <div className="absolute left-3 right-3 z-10 pointer-events-none" style={{ bottom: "1.6rem" }}>
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
