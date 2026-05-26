import {
  converter,
  formatHex,
  modeRgb,
  useMode as registerCuloriMode,
  type CuloriColor,
} from "culori/fn";

export type VisionMode = "normal" | "protan" | "deutan" | "tritan";
export type SwatchZonePart = "primary" | "secondary";

export interface ColorAccessibilitySettings {
  visionMode: VisionMode;
  showSymbols: boolean;
  showPatterns: boolean;
}

export interface SwatchOverlayToken {
  symbol: string;
  pattern: "diagonal" | "backslash" | "horizontal" | "vertical" | "grid" | "dots";
}

type RgbColor = CuloriColor & {
  mode: "rgb";
  r: number;
  g: number;
  b: number;
};

type CvdMatrix = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

registerCuloriMode(modeRgb);

const rgbConverter = converter("rgb");

export const DEFAULT_COLOR_ACCESSIBILITY_SETTINGS: ColorAccessibilitySettings = {
  visionMode: "normal",
  showSymbols: false,
  showPatterns: false,
};

export const VISION_MODES = ["normal", "protan", "deutan", "tritan"] as const;

const CVD_MATRICES: Record<Exclude<VisionMode, "normal">, CvdMatrix> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const OVERLAY_SYMBOLS = ["+", "x", "o", "#", "=", "~", "/", "\\"];
const OVERLAY_PATTERNS: SwatchOverlayToken["pattern"][] = [
  "diagonal",
  "backslash",
  "horizontal",
  "vertical",
  "grid",
  "dots",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const normalizeVisionMode = (value: unknown): VisionMode =>
  typeof value === "string" && VISION_MODES.includes(value as VisionMode)
    ? (value as VisionMode)
    : DEFAULT_COLOR_ACCESSIBILITY_SETTINGS.visionMode;

export const normalizeColorAccessibilitySettings = (
  value: unknown,
): ColorAccessibilitySettings => {
  if (!isRecord(value)) {
    return { ...DEFAULT_COLOR_ACCESSIBILITY_SETTINGS };
  }

  return {
    visionMode: normalizeVisionMode(value.visionMode),
    showSymbols:
      typeof value.showSymbols === "boolean"
        ? value.showSymbols
        : DEFAULT_COLOR_ACCESSIBILITY_SETTINGS.showSymbols,
    showPatterns:
      typeof value.showPatterns === "boolean"
        ? value.showPatterns
        : DEFAULT_COLOR_ACCESSIBILITY_SETTINGS.showPatterns,
  };
};

export const parseColorAccessibilitySettingsJson = (
  storedValue: string | null,
): ColorAccessibilitySettings => {
  if (!storedValue) {
    return { ...DEFAULT_COLOR_ACCESSIBILITY_SETTINGS };
  }

  try {
    return normalizeColorAccessibilitySettings(JSON.parse(storedValue));
  } catch {
    return { ...DEFAULT_COLOR_ACCESSIBILITY_SETTINGS };
  }
};

export const serializeColorAccessibilitySettings = (
  settings: ColorAccessibilitySettings,
): string => JSON.stringify(normalizeColorAccessibilitySettings(settings));

const toRgbColor = (hex: string): RgbColor | null => {
  const converted = rgbConverter(hex);
  if (
    !converted ||
    converted.mode !== "rgb" ||
    typeof converted.r !== "number" ||
    typeof converted.g !== "number" ||
    typeof converted.b !== "number"
  ) {
    return null;
  }

  return {
    mode: "rgb",
    r: converted.r,
    g: converted.g,
    b: converted.b,
    alpha:
      typeof converted.alpha === "number" ? converted.alpha : undefined,
  };
};

export const normalizeHexColor = (hex: string): string => {
  const rgb = toRgbColor(hex);
  return rgb ? (formatHex(rgb) ?? hex).toLowerCase() : hex;
};

export const simulateHexColor = (hex: string, mode: VisionMode): string => {
  const rgb = toRgbColor(hex);
  if (!rgb) return hex;
  if (mode === "normal") return normalizeHexColor(hex);

  const matrix = CVD_MATRICES[mode];
  const simulated: RgbColor = {
    mode: "rgb",
    r: clamp01(matrix[0][0] * rgb.r + matrix[0][1] * rgb.g + matrix[0][2] * rgb.b),
    g: clamp01(matrix[1][0] * rgb.r + matrix[1][1] * rgb.g + matrix[1][2] * rgb.b),
    b: clamp01(matrix[2][0] * rgb.r + matrix[2][1] * rgb.g + matrix[2][2] * rgb.b),
  };

  return (formatHex(simulated) ?? hex).toLowerCase();
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const getSwatchOverlayToken = (
  identity: string,
  part: SwatchZonePart,
): SwatchOverlayToken => {
  const colorHash = hashString(identity);
  const partOffset = part === "primary" ? 0 : 1;
  return {
    symbol: OVERLAY_SYMBOLS[
      (colorHash + partOffset) % OVERLAY_SYMBOLS.length
    ],
    pattern: OVERLAY_PATTERNS[
      (colorHash + partOffset) % OVERLAY_PATTERNS.length
    ],
  };
};
