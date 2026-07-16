import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import {
  Button as AriaButton,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorThumb,
  Dialog,
  DialogTrigger,
  Input as AriaInput,
  Label,
  Popover,
  SliderTrack,
  type Color,
} from "react-aria-components";
import SwatchAssistOverlay from "@/components/accessibility/SwatchAssistOverlay";
import { cn } from "@/lib/utils";
import {
  getVisionModeCssColorMatrix,
  normalizeHexColor,
  simulateHexColor,
  type SwatchOverlayToken,
  type VisionMode,
} from "@/lib/color-accessibility";
import { isHexColor } from "./utils";

type OwnColorPickerProps = {
  value: string;
  fallbackValue?: string;
  assistToken: SwatchOverlayToken;
  showSymbols: boolean;
  showPatterns: boolean;
  visionMode: VisionMode;
  ariaLabel: string;
  testId: string;
  triggerClassName?: string;
  onChange: (value: string) => void;
};

const EMPTY_PICKER_COLOR = "#000000";

const getPickerColor = (value: string, fallbackValue?: string): string => {
  if (isHexColor(value)) {
    return normalizeHexColor(value.trim()).toUpperCase();
  }

  if (fallbackValue && isHexColor(fallbackValue)) {
    return normalizeHexColor(fallbackValue.trim()).toUpperCase();
  }

  return EMPTY_PICKER_COLOR;
};

const getVisionModeName = (visionMode: VisionMode): string =>
  visionMode === "normal" ? "default" : visionMode;

const toPickerHex = (color: Color): string => color.toString("hex").toUpperCase();

const getHueLabel = (color: Color): string => {
  const hue = color.toFormat("hsb").getChannelValue("hue");
  return Number.isFinite(hue) ? `${hue.toFixed(2)}\u00b0` : "0.00\u00b0";
};

const ColorVisionFilter = ({
  id,
  colorMatrix,
}: {
  id: string;
  colorMatrix: string | null;
}) => {
  if (!colorMatrix) return null;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="absolute h-0 w-0 overflow-hidden"
    >
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={colorMatrix} />
        </filter>
      </defs>
    </svg>
  );
};

const OwnColorPicker = ({
  value,
  fallbackValue,
  assistToken,
  showSymbols,
  showPatterns,
  visionMode,
  ariaLabel,
  testId,
  triggerClassName,
  onChange,
}: OwnColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(() =>
    getPickerColor(value, fallbackValue),
  );
  const hasUncommittedChangeRef = useRef(false);
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const realColor = getPickerColor(value, fallbackValue);
  const activeColor = isOpen ? draftColor : realColor;
  const displayColor = simulateHexColor(activeColor, visionMode);
  const visionModeName = getVisionModeName(visionMode);
  const colorMatrix = getVisionModeCssColorMatrix(visionMode);
  const filterId = `own-color-picker-filter-${reactId}`;
  const filteredVisualStyle = colorMatrix
    ? { filter: `url(#${filterId})` }
    : undefined;

  useEffect(() => {
    if (!isOpen) {
      setDraftColor(realColor);
    }
  }, [isOpen, realColor]);

  const commitHex = useCallback(
    (hex: string) => {
      onChange(hex.toUpperCase());
      hasUncommittedChangeRef.current = false;
    },
    [onChange],
  );

  const handlePreviewColorChange = (color: Color) => {
    setDraftColor(toPickerHex(color));
    hasUncommittedChangeRef.current = true;
  };

  const handleColorChangeEnd = (color: Color) => {
    commitHex(toPickerHex(color));
  };

  const handleHexInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const hex = event.currentTarget.value;
    if (isHexColor(hex)) {
      commitHex(normalizeHexColor(hex).toUpperCase());
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && hasUncommittedChangeRef.current) {
      commitHex(draftColor);
    }

    if (nextOpen) {
      setDraftColor(realColor);
      hasUncommittedChangeRef.current = false;
    }

    setIsOpen(nextOpen);
  };

  return (
    <ColorPicker value={draftColor} onChange={handlePreviewColorChange}>
      {({ color }) => (
        <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
          <AriaButton
            aria-label={`Open ${ariaLabel} color picker`}
            data-testid={`${testId}-trigger`}
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              triggerClassName,
            )}
          >
            <span
              className="relative block size-8 overflow-hidden rounded-sm border border-black/25"
              data-testid={`${testId}-selected-swatch-frame`}
            >
              <ColorSwatch
                color={displayColor}
                colorName={`${activeColor} previewed in ${visionModeName} mode`}
                className="size-full"
                data-testid={`${testId}-selected-swatch`}
              />
              <SwatchAssistOverlay
                token={assistToken}
                showSymbol={showSymbols}
                showPattern={showPatterns}
                presentation="compact"
              />
            </span>
          </AriaButton>
          <Popover
            placement="bottom end"
            offset={6}
            className="z-50 w-[min(90vw,20rem)] rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none"
          >
            <Dialog
              aria-label={`${ariaLabel} color picker`}
              className="relative space-y-4 outline-none"
            >
              <ColorVisionFilter id={filterId} colorMatrix={colorMatrix} />
              <ColorArea
                colorSpace="hsb"
                xChannel="saturation"
                yChannel="brightness"
                aria-label={`${ariaLabel} saturation and brightness`}
                onChangeEnd={handleColorChangeEnd}
                className="relative aspect-square w-full overflow-hidden rounded-md border border-black/30 shadow-inner"
                style={filteredVisualStyle}
                data-testid={`${testId}-area`}
              >
                <ColorThumb
                  data-testid={`${testId}-area-thumb`}
                  className={({ isFocusVisible }) =>
                    cn(
                      "size-7 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.85)] outline-none",
                      isFocusVisible &&
                        "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                    )
                  }
                />
              </ColorArea>

              <ColorSlider
                colorSpace="hsb"
                channel="hue"
                aria-label={`${ariaLabel} hue`}
                onChangeEnd={handleColorChangeEnd}
                className="space-y-2"
                data-testid={`${testId}-hue-slider`}
              >
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-muted-foreground">
                  <Label>Hue</Label>
                  <span className="font-mono tabular-nums">
                    {getHueLabel(color)}
                  </span>
                </div>
                <SliderTrack
                  className="relative h-8 rounded-md border border-black/20"
                  style={filteredVisualStyle}
                  data-testid={`${testId}-hue-track`}
                >
                  <ColorThumb
                    data-testid={`${testId}-hue-thumb`}
                    className={({ isFocusVisible }) =>
                      cn(
                        "top-1/2 size-7 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.85)] outline-none",
                        isFocusVisible &&
                          "ring-2 ring-ring ring-offset-2 ring-offset-popover",
                      )
                    }
                  />
                </SliderTrack>
              </ColorSlider>

              <ColorField
                aria-label={`${ariaLabel} hex value`}
                className="space-y-2"
              >
                <Label className="block text-sm font-semibold text-muted-foreground">
                  Hex
                </Label>
                <AriaInput
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid={`${testId}-hex-input`}
                  onBlur={handleHexInputBlur}
                />
              </ColorField>
            </Dialog>
          </Popover>
        </DialogTrigger>
      )}
    </ColorPicker>
  );
};

export default OwnColorPicker;
