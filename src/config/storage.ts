export const DEFAULT_COPY_COUNTS_STORAGE_KEY = "ficsit-color-copy-counts";
export const OWN_COPY_COUNTS_STORAGE_KEY = "ficsit-color-copy-counts-own";
export const OWN_PALETTE_STORAGE_KEY = "ownPalette";
export const RESET_COPY_COUNTS_EVENT = "ficsit:reset-copy-counters";
export const ACCESSIBILITY_SETTINGS_STORAGE_KEY =
  "ficsit-accessibility-settings";

export const ALL_COPY_COUNT_STORAGE_KEYS = [
  DEFAULT_COPY_COUNTS_STORAGE_KEY,
  OWN_COPY_COUNTS_STORAGE_KEY,
] as const;
