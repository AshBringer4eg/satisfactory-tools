import { converter, formatHex, type CuloriColor } from "culori";
import {
  normalizeHexColor,
  simulateHexColor,
  type VisionMode,
} from "@/lib/color-accessibility";

export type HarmonyMode =
  | "analogous"
  | "complementary"
  | "doubleSplitComplementary"
  | "rectangle"
  | "splitComplementary"
  | "tetradic"
  | "triadic";

export interface HarmonySwatch {
  id: string;
  label: string;
  hex: string;
  textColor: "#000000" | "#ffffff";
  isAnchor: boolean;
  adjusted: boolean;
  hasContrastConflict: boolean;
  hasColorblindConflict: boolean;
}

interface HarmonyPaletteOptions {
  anchors: string[];
  mode: HarmonyMode;
  factorySafe: boolean;
}

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type OklchColor = CuloriColor & {
  mode: "oklch";
  l: number;
  c: number;
  h?: number;
};

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const rgbConverter = converter("rgb");
const oklchConverter = converter("oklch");
const VISION_CHECK_MODES: VisionMode[] = ["normal", "protan", "deutan", "tritan"];
const CONTRAST_RATIO_MINIMUM = 1.45;
const COLORBLIND_DISTANCE_MINIMUM = 0.16;

const HARMONY_OFFSETS: Record<HarmonyMode, number[]> = {
  analogous: [0, -30, 30],
  complementary: [0, 180],
  doubleSplitComplementary: [0, 150, 210, 30, 330],
  rectangle: [0, 60, 180, 240],
  splitComplementary: [0, 150, 210],
  tetradic: [0, 90, 180, 270],
  triadic: [0, 120, 240],
};

export const HARMONY_MODES: HarmonyMode[] = [
  "analogous",
  "complementary",
  "doubleSplitComplementary",
  "rectangle",
  "splitComplementary",
  "tetradic",
  "triadic",
];

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const wrapHue = (hue: number): number => ((hue % 360) + 360) % 360;

export const normalizeHarmonyHex = (value: string): string | null => {
  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) return null;
  return normalizeHexColor(trimmed).toUpperCase();
};

const toRgb = (hex: string): RgbColor | null => {
  const color = rgbConverter(hex);
  if (
    !color ||
    color.mode !== "rgb" ||
    typeof color.r !== "number" ||
    typeof color.g !== "number" ||
    typeof color.b !== "number"
  ) {
    return null;
  }

  return {
    r: clamp(color.r, 0, 1),
    g: clamp(color.g, 0, 1),
    b: clamp(color.b, 0, 1),
  };
};

const toOklch = (hex: string): OklchColor | null => {
  const color = oklchConverter(hex);
  if (
    !color ||
    color.mode !== "oklch" ||
    typeof color.l !== "number" ||
    typeof color.c !== "number"
  ) {
    return null;
  }

  return {
    mode: "oklch",
    l: clamp(color.l, 0, 1),
    c: Math.max(0, color.c),
    h: typeof color.h === "number" ? wrapHue(color.h) : 0,
  };
};

const fromOklch = (color: OklchColor): string | null => {
  const formatted = formatHex({
    mode: "oklch",
    l: clamp(color.l, 0.08, 0.92),
    c: clamp(color.c, 0.02, 0.34),
    h: wrapHue(color.h ?? 0),
  });

  return formatted ? normalizeHarmonyHex(formatted) : null;
};

const relativeLuminance = (hex: string): number => {
  const rgb = toRgb(hex);
  if (!rgb) return 0;

  const linear = [rgb.r, rgb.g, rgb.b].map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrastRatio = (leftHex: string, rightHex: string): number => {
  const left = relativeLuminance(leftHex);
  const right = relativeLuminance(rightHex);
  const lighter = Math.max(left, right);
  const darker = Math.min(left, right);
  return (lighter + 0.05) / (darker + 0.05);
};

const getTextColor = (hex: string): "#000000" | "#ffffff" =>
  contrastRatio(hex, "#000000") >= contrastRatio(hex, "#ffffff")
    ? "#000000"
    : "#ffffff";

const colorDistance = (leftHex: string, rightHex: string): number => {
  const left = toRgb(leftHex);
  const right = toRgb(rightHex);
  if (!left || !right) return 1;

  return Math.sqrt(
    (left.r - right.r) ** 2 +
      (left.g - right.g) ** 2 +
      (left.b - right.b) ** 2,
  );
};

const hasContrastConflict = (hex: string, existingHexes: string[]): boolean =>
  existingHexes.some(
    (existingHex) => contrastRatio(hex, existingHex) < CONTRAST_RATIO_MINIMUM,
  );

const hasColorblindConflict = (hex: string, existingHexes: string[]): boolean =>
  existingHexes.some((existingHex) =>
    VISION_CHECK_MODES.some((mode) => {
      const simulatedHex = simulateHexColor(hex, mode);
      const simulatedExistingHex = simulateHexColor(existingHex, mode);
      return colorDistance(simulatedHex, simulatedExistingHex) < COLORBLIND_DISTANCE_MINIMUM;
    }),
  );

const passesFactoryChecks = (hex: string, existingHexes: string[]): boolean =>
  !hasContrastConflict(hex, existingHexes) && !hasColorblindConflict(hex, existingHexes);

const adjustForFactoryChecks = (
  hex: string,
  existingHexes: string[],
): { hex: string; adjusted: boolean } => {
  if (passesFactoryChecks(hex, existingHexes)) {
    return { hex, adjusted: false };
  }

  const base = toOklch(hex);
  if (!base) return { hex, adjusted: false };

  for (let attempt = 0; attempt < 48; attempt += 1) {
    const direction = attempt % 2 === 0 ? 1 : -1;
    const step = Math.floor(attempt / 2) + 1;
    const candidate = fromOklch({
      mode: "oklch",
      l: clamp(base.l + direction * 0.035 * ((step % 4) + 1), 0.18, 0.84),
      c: clamp(base.c * (1 - Math.floor(step / 6) * 0.12), 0.06, 0.28),
      h: wrapHue((base.h ?? 0) + direction * step * 8),
    });

    if (candidate && passesFactoryChecks(candidate, existingHexes)) {
      return { hex: candidate, adjusted: true };
    }
  }

  return { hex, adjusted: false };
};

const averageOklch = (colors: OklchColor[]): OklchColor => {
  if (colors.length === 1) return colors[0];

  const hueVector = colors.reduce(
    (accumulator, color) => {
      const hueRadians = ((color.h ?? 0) * Math.PI) / 180;
      return {
        x: accumulator.x + Math.cos(hueRadians),
        y: accumulator.y + Math.sin(hueRadians),
      };
    },
    { x: 0, y: 0 },
  );

  return {
    mode: "oklch",
    l: colors.reduce((sum, color) => sum + color.l, 0) / colors.length,
    c: colors.reduce((sum, color) => sum + color.c, 0) / colors.length,
    h: wrapHue((Math.atan2(hueVector.y, hueVector.x) * 180) / Math.PI),
  };
};

export const createHarmonyPalette = ({
  anchors,
  mode,
  factorySafe,
}: HarmonyPaletteOptions): HarmonySwatch[] => {
  const normalizedAnchors = anchors
    .map(normalizeHarmonyHex)
    .filter((hex): hex is string => Boolean(hex));

  if (normalizedAnchors.length === 0) return [];

  const anchorOklchColors = normalizedAnchors
    .map(toOklch)
    .filter((color): color is OklchColor => Boolean(color));

  if (anchorOklchColors.length === 0) return [];

  const base = averageOklch(anchorOklchColors);
  const swatches: HarmonySwatch[] = [];
  const acceptedHexes: string[] = [];

  normalizedAnchors.forEach((anchorHex, index) => {
    swatches.push({
      id: `anchor-${index}`,
      label: `Anchor ${index + 1}`,
      hex: anchorHex,
      textColor: getTextColor(anchorHex),
      isAnchor: true,
      adjusted: false,
      hasContrastConflict: hasContrastConflict(anchorHex, acceptedHexes),
      hasColorblindConflict: hasColorblindConflict(anchorHex, acceptedHexes),
    });
    acceptedHexes.push(anchorHex);
  });

  HARMONY_OFFSETS[mode].forEach((offset, index) => {
    if (offset === 0 && normalizedAnchors.length === 1) return;

    const rawHex = fromOklch({
      mode: "oklch",
      l: base.l,
      c: base.c,
      h: wrapHue((base.h ?? 0) + offset),
    });

    if (!rawHex || acceptedHexes.includes(rawHex)) return;

    const result = factorySafe
      ? adjustForFactoryChecks(rawHex, acceptedHexes)
      : { hex: rawHex, adjusted: false };

    swatches.push({
      id: `suggestion-${offset}-${index}`,
      label: `Suggestion ${index + 1}`,
      hex: result.hex,
      textColor: getTextColor(result.hex),
      isAnchor: false,
      adjusted: result.adjusted,
      hasContrastConflict: hasContrastConflict(result.hex, acceptedHexes),
      hasColorblindConflict: hasColorblindConflict(result.hex, acceptedHexes),
    });
    acceptedHexes.push(result.hex);
  });

  return swatches;
};
