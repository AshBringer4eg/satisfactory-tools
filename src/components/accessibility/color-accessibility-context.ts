import { createContext, useContext } from "react";
import {
  DEFAULT_COLOR_ACCESSIBILITY_SETTINGS,
  type ColorAccessibilitySettings,
  type VisionMode,
} from "@/lib/color-accessibility";

export interface ColorAccessibilityContextValue {
  settings: ColorAccessibilitySettings;
  setVisionMode: (mode: VisionMode) => void;
  setShowSymbols: (showSymbols: boolean) => void;
  setShowPatterns: (showPatterns: boolean) => void;
}

const noop = () => {};

const defaultContextValue: ColorAccessibilityContextValue = {
  settings: DEFAULT_COLOR_ACCESSIBILITY_SETTINGS,
  setVisionMode: noop,
  setShowSymbols: noop,
  setShowPatterns: noop,
};

export const ColorAccessibilityContext =
  createContext<ColorAccessibilityContextValue>(defaultContextValue);

export const useColorAccessibility = (): ColorAccessibilityContextValue =>
  useContext(ColorAccessibilityContext);
