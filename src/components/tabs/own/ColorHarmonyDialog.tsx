import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, HelpCircle, SwatchBook } from "lucide-react";
import SwatchAssistOverlay from "@/components/accessibility/SwatchAssistOverlay";
import { useColorAccessibility } from "@/components/accessibility/color-accessibility-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createHarmonyPalette,
  getHarmonyTextColor,
  HARMONY_MODES,
  normalizeHarmonyHex,
  type HarmonyMode,
} from "@/lib/color-harmony";
import {
  getSwatchOverlayToken,
  simulateHexColor,
} from "@/lib/color-accessibility";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useTutorial } from "@/tutorials/tutorial-context";

interface ColorHarmonyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrimaryHex?: string;
  initialSecondaryHex?: string;
}

const inputLabelClassName =
  "font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

const getModeLabel = (mode: HarmonyMode): string =>
  t(`ownTab.harmony.modes.${mode}`);

const ColorHarmonyDialog = ({
  open,
  onOpenChange,
  initialPrimaryHex = "#CB603A",
  initialSecondaryHex = "",
}: ColorHarmonyDialogProps) => {
  const [primaryHex, setPrimaryHex] = useState(initialPrimaryHex.toUpperCase());
  const [secondaryHex, setSecondaryHex] = useState(initialSecondaryHex.toUpperCase());
  const [mode, setMode] = useState<HarmonyMode>("complementary");
  const [factorySafe, setFactorySafe] = useState(true);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const { settings } = useColorAccessibility();
  const { activeTutorial, isRunning, reportTutorialAction } = useTutorial();
  const isHarmonyTutorialRunning = activeTutorial === "harmony" && isRunning;

  useEffect(() => {
    if (!open) return;
    setPrimaryHex(initialPrimaryHex.toUpperCase());
    setSecondaryHex(initialSecondaryHex.toUpperCase());
    setCopiedHex(null);
  }, [initialPrimaryHex, initialSecondaryHex, open]);

  const primaryNormalized = normalizeHarmonyHex(primaryHex);
  const secondaryNormalized = secondaryHex.trim()
    ? normalizeHarmonyHex(secondaryHex)
    : null;
  const hasPrimaryError = primaryHex.trim().length > 0 && !primaryNormalized;
  const hasSecondaryError =
    secondaryHex.trim().length > 0 && !secondaryNormalized;

  const swatches = useMemo(
    () =>
      createHarmonyPalette({
        anchors: [primaryHex, secondaryHex],
        mode,
        factorySafe,
      }),
    [factorySafe, mode, primaryHex, secondaryHex],
  );

  const copyHex = useCallback((hex: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopiedHex(null);
      return;
    }

    void navigator.clipboard.writeText(hex).then(
      () => {
        setCopiedHex(hex);
        reportTutorialAction({ type: "harmony-copy" });
      },
      () => setCopiedHex(null),
    );
  }, [reportTutorialAction]);

  return (
    <Dialog
      modal={!isHarmonyTutorialRunning}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[2px] p-0"
        data-tutorial="harmony-dialog"
        data-testid="harmony-dialog"
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null;

          if (
            isHarmonyTutorialRunning &&
            target?.closest(".react-joyride__floater")
          ) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="border-b border-border px-4 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-wider">
            <SwatchBook className="size-4" aria-hidden="true" />
            {t("ownTab.harmony.title")}
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] uppercase tracking-wider">
            {t("ownTab.harmony.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 p-4 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className={inputLabelClassName}>
                {t("ownTab.harmony.anchorPrimary")}
              </span>
              <Input
                value={primaryHex}
                onChange={(event) => setPrimaryHex(event.target.value.toUpperCase())}
                placeholder="#CB603A"
                aria-invalid={hasPrimaryError}
                data-testid="harmony-primary-input"
                className={cn(
                  "font-mono uppercase",
                  hasPrimaryError ? "border-destructive" : null,
                )}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className={inputLabelClassName}>
                {t("ownTab.harmony.anchorSecondary")}
              </span>
              <Input
                value={secondaryHex}
                onChange={(event) => setSecondaryHex(event.target.value.toUpperCase())}
                placeholder={t("ownTab.harmony.optionalAnchor")}
                aria-invalid={hasSecondaryError}
                data-testid="harmony-secondary-input"
                className={cn(
                  "font-mono uppercase",
                  hasSecondaryError ? "border-destructive" : null,
                )}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className={inputLabelClassName}>
                {t("ownTab.harmony.mode")}
              </span>
              <Select
                value={mode}
                onValueChange={(value) => {
                  const nextMode = value as HarmonyMode;
                  setMode(nextMode);
                  reportTutorialAction({ type: "harmony-mode", mode: nextMode });
                }}
              >
                <SelectTrigger
                  className="rounded-[2px] font-mono uppercase"
                  data-tutorial="harmony-mode"
                  data-testid="harmony-mode-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {HARMONY_MODES.map((harmonyMode) => (
                    <SelectItem
                      key={harmonyMode}
                      value={harmonyMode}
                      data-testid={`harmony-mode-option-${harmonyMode}`}
                    >
                      {getModeLabel(harmonyMode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <div className="flex items-center gap-3 rounded-[2px] border border-border bg-surface px-3 py-2">
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={factorySafe}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setFactorySafe(enabled);
                    reportTutorialAction({ type: "factory-safe", enabled });
                  }}
                  data-tutorial="harmony-factory-safe"
                  className="size-4 accent-primary"
                />
                <span className="font-mono text-[12px] uppercase tracking-wider">
                  {t("ownTab.harmony.factorySafe")}
                </span>
              </label>
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={t("ownTab.harmony.factorySafeHelpAria")}
                    >
                      <HelpCircle className="size-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-[260px] font-mono text-[11px] uppercase leading-relaxed tracking-wider"
                  >
                    {t("ownTab.harmony.factorySafeHelp")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {(hasPrimaryError || hasSecondaryError) && (
              <div className="rounded-[2px] border border-destructive/50 bg-destructive/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-destructive">
                {t("ownTab.harmony.invalidHex")}
              </div>
            )}
          </div>

          <div className="min-h-[360px] overflow-hidden rounded-[2px] border border-border bg-surface">
            {swatches.length > 0 ? (
              <div
                className="grid h-full min-h-[360px]"
                style={{
                  gridTemplateRows: `repeat(${swatches.length}, minmax(84px, 1fr))`,
                }}
              >
                {swatches.map((swatch) => {
                  const displayHex = simulateHexColor(
                    swatch.hex,
                    settings.visionMode,
                  );
                  const assistToken = getSwatchOverlayToken(
                    swatch.id,
                    "primary",
                  );

                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => copyHex(swatch.hex)}
                      data-tutorial={swatch.isAnchor ? undefined : "harmony-suggestion"}
                      data-testid="harmony-swatch"
                      className="group relative flex min-h-[84px] items-center justify-center border-b border-black/10 text-center transition-opacity last:border-b-0 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                      style={{
                        backgroundColor: displayHex,
                        color: getHarmonyTextColor(displayHex),
                      }}
                      aria-label={t("ownTab.harmony.copyHex", {
                        hex: swatch.hex,
                      })}
                    >
                      <SwatchAssistOverlay
                        token={assistToken}
                        showSymbol={settings.showSymbols}
                        showPattern={settings.showPatterns}
                      />
                      <span className="relative z-10 font-mono text-[24px] font-bold tracking-normal">
                        {swatch.hex.slice(1).toUpperCase()}
                      </span>

                      <span className="absolute left-2 top-2 z-10 rounded-[2px] bg-black/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                        {swatch.isAnchor
                          ? t("ownTab.harmony.anchor")
                          : t("ownTab.harmony.suggestion")}
                      </span>

                      <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-[2px] bg-black/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                        {copiedHex === swatch.hex ? (
                          <Check className="size-3" aria-hidden="true" />
                        ) : (
                          <Copy className="size-3" aria-hidden="true" />
                        )}
                        {copiedHex === swatch.hex
                          ? t("ownTab.harmony.copied")
                          : t("ownTab.harmony.copy")}
                      </span>

                      <span className="absolute bottom-2 left-2 right-2 z-10 flex flex-wrap gap-1">
                        {swatch.adjusted ? (
                          <span className="rounded-[2px] bg-black/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
                            {t("ownTab.harmony.adjusted")}
                          </span>
                        ) : null}
                        {swatch.hasContrastConflict ? (
                          <span className="rounded-[2px] bg-black/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
                            {t("ownTab.harmony.lowContrast")}
                          </span>
                        ) : null}
                        {swatch.hasColorblindConflict ? (
                          <span className="rounded-[2px] bg-black/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
                            {t("ownTab.harmony.cvdConflict")}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center px-6 text-center font-mono text-[12px] uppercase tracking-wider text-muted-foreground">
                {t("ownTab.harmony.empty")}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColorHarmonyDialog;
