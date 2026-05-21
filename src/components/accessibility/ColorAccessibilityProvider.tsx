import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ACCESSIBILITY_SETTINGS_STORAGE_KEY } from "@/config/storage";
import {
  DEFAULT_COLOR_ACCESSIBILITY_SETTINGS,
  normalizeColorAccessibilitySettings,
  parseColorAccessibilitySettingsJson,
  serializeColorAccessibilitySettings,
  type ColorAccessibilitySettings,
  type VisionMode,
} from "@/lib/color-accessibility";
import {
  ColorAccessibilityContext,
  type ColorAccessibilityContextValue,
} from "./color-accessibility-context";

const readStoredSettings = (): ColorAccessibilitySettings => {
  if (typeof window === "undefined") {
    return { ...DEFAULT_COLOR_ACCESSIBILITY_SETTINGS };
  }

  try {
    return parseColorAccessibilitySettingsJson(
      window.localStorage.getItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY),
    );
  } catch {
    return { ...DEFAULT_COLOR_ACCESSIBILITY_SETTINGS };
  }
};

export const ColorAccessibilityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [settings, setSettings] =
    useState<ColorAccessibilitySettings>(readStoredSettings);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        ACCESSIBILITY_SETTINGS_STORAGE_KEY,
        serializeColorAccessibilitySettings(settings),
      );
    } catch {
      // Ignore storage write failures.
    }
  }, [settings]);

  const updateSettings = useCallback(
    (patch: Partial<ColorAccessibilitySettings>) => {
      setSettings((current) =>
        normalizeColorAccessibilitySettings({ ...current, ...patch }),
      );
    },
    [],
  );

  const setVisionMode = useCallback(
    (visionMode: VisionMode) => updateSettings({ visionMode }),
    [updateSettings],
  );

  const setShowSymbols = useCallback(
    (showSymbols: boolean) => updateSettings({ showSymbols }),
    [updateSettings],
  );

  const setShowPatterns = useCallback(
    (showPatterns: boolean) => updateSettings({ showPatterns }),
    [updateSettings],
  );

  const value = useMemo<ColorAccessibilityContextValue>(
    () => ({
      settings,
      setVisionMode,
      setShowSymbols,
      setShowPatterns,
    }),
    [
      setShowPatterns,
      setShowSymbols,
      setVisionMode,
      settings,
    ],
  );

  return (
    <ColorAccessibilityContext.Provider value={value}>
      {children}
    </ColorAccessibilityContext.Provider>
  );
};
