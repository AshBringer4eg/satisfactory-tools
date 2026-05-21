import { Eye, Layers, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { t } from "@/i18n";
import {
  VISION_MODES,
  type VisionMode,
} from "@/lib/color-accessibility";
import { useColorAccessibility } from "./color-accessibility-context";

const modeLabelKeyByMode: Record<VisionMode, string> = {
  normal: "accessibility.modes.normal",
  protan: "accessibility.modes.protan",
  deutan: "accessibility.modes.deutan",
  tritan: "accessibility.modes.tritan",
};

const AccessibilityPaletteMenu = () => {
  const {
    settings,
    setVisionMode,
    setShowSymbols,
    setShowPatterns,
  } = useColorAccessibility();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={t("accessibility.openAria")}
          className="h-8 px-2"
          data-testid="accessibility-menu-trigger"
        >
          <Eye aria-hidden="true" />
          <span className="hidden sm:inline">{t("accessibility.trigger")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(92vw,480px)] overflow-y-auto sm:max-w-[480px]"
      >
        <SheetHeader>
          <SheetTitle>{t("accessibility.title")}</SheetTitle>
          <SheetDescription>
            {t("accessibility.description")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 font-mono text-[12px]">
          <section aria-labelledby="accessibility-simulation-heading">
            <h2
              id="accessibility-simulation-heading"
              className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {t("accessibility.simulation")}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {VISION_MODES.map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={
                    settings.visionMode === mode ? "default" : "outline"
                  }
                  size="sm"
                  aria-pressed={settings.visionMode === mode}
                  onClick={() => setVisionMode(mode)}
                  data-testid={`accessibility-mode-${mode}`}
                  className="justify-start"
                >
                  {t(modeLabelKeyByMode[mode])}
                </Button>
              ))}
            </div>
          </section>

          <section aria-labelledby="accessibility-overlays-heading">
            <h2
              id="accessibility-overlays-heading"
              className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {t("accessibility.overlays")}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={settings.showSymbols ? "default" : "outline"}
                size="sm"
                aria-pressed={settings.showSymbols}
                onClick={() => setShowSymbols(!settings.showSymbols)}
                data-testid="accessibility-symbols-toggle"
                className="justify-start"
              >
                <Shapes aria-hidden="true" />
                {t("accessibility.symbols")}
              </Button>
              <Button
                type="button"
                variant={settings.showPatterns ? "default" : "outline"}
                size="sm"
                aria-pressed={settings.showPatterns}
                onClick={() => setShowPatterns(!settings.showPatterns)}
                data-testid="accessibility-patterns-toggle"
                className="justify-start"
              >
                <Layers aria-hidden="true" />
                {t("accessibility.patterns")}
              </Button>
            </div>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AccessibilityPaletteMenu;
