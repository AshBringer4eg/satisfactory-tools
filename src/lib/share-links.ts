import type { ColorCode } from "@/data/colors";
import colorsData from "@/data/colors.json";

export type ShareCardMode = "one" | "two";
export type ModeShareId = "solo" | "duo" | "own";

const staticShareColorCodes = new Set(
  (colorsData as { colors?: Array<{ code?: unknown }> }).colors
    ?.map((color) => color.code)
    .filter((code): code is ColorCode => typeof code === "string") ?? [],
);

export const hasStaticShareCard = (colorCode: ColorCode): boolean =>
  staticShareColorCodes.has(colorCode);

export const getShareCardRelativePath = (
  colorCode: ColorCode,
  mode: ShareCardMode,
): string => `share/${encodeURIComponent(colorCode)}/${mode}.html`;

export const getShareCardUrl = (
  colorCode: ColorCode,
  mode: ShareCardMode,
  origin = window.location.origin,
  basePath = import.meta.env.BASE_URL,
): string => {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return new URL(
    `${normalizedBase}${getShareCardRelativePath(colorCode, mode)}`,
    origin,
  ).toString();
};

export const getModeShareRelativePath = (mode: ModeShareId): string =>
  `${mode}/`;

export const getModeShareUrl = (
  mode: ModeShareId,
  origin = window.location.origin,
  basePath = import.meta.env.BASE_URL,
): string => {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return new URL(
    `${normalizedBase}${getModeShareRelativePath(mode)}`,
    origin,
  ).toString();
};
