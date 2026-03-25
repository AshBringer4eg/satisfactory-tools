import { OWN_PALETTE_STORAGE_KEY } from "@/config/storage";
import type { ColorsFile } from "@/data/colors";

export type OwnPaletteStorageReadResult =
  | { status: "ok"; value: string | null }
  | { status: "read_error" };

export const readOwnPaletteStorage = (): OwnPaletteStorageReadResult => {
  if (typeof window === "undefined") {
    return { status: "ok", value: null };
  }

  try {
    return {
      status: "ok",
      value: window.localStorage.getItem(OWN_PALETTE_STORAGE_KEY),
    };
  } catch {
    return { status: "read_error" };
  }
};

export const writeOwnPaletteStorage = (file: ColorsFile): boolean => {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    window.localStorage.setItem(OWN_PALETTE_STORAGE_KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
};

export type ClipboardCopyResult = "copied" | "unavailable" | "failed";

export const copyTextToClipboard = async (
  value: string,
): Promise<ClipboardCopyResult> => {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return "unavailable";
  }

  try {
    await navigator.clipboard.writeText(value);
    return "copied";
  } catch {
    return "failed";
  }
};
