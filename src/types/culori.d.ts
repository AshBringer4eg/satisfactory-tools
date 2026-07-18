declare module "culori" {
  export type CuloriColor = {
    mode: string;
    alpha?: number;
    [channel: string]: string | number | undefined;
  };

  export function converter(
    targetMode?: string,
  ): (color: string | CuloriColor) => CuloriColor | undefined;

  export function formatHex(color: string | CuloriColor): string | undefined;
}

declare module "culori/fn" {
  export type CuloriColor = {
    mode: string;
    alpha?: number;
    [channel: string]: string | number | undefined;
  };

  export type CuloriModeDefinition = Record<string, unknown>;

  export const modeRgb: CuloriModeDefinition;

  export function useMode(
    modeDefinition: CuloriModeDefinition,
  ): (color?: string | CuloriColor) => CuloriColor | undefined;

  export function converter(
    targetMode?: string,
  ): (color: string | CuloriColor) => CuloriColor | undefined;

  export function formatHex(color: string | CuloriColor): string | undefined;
}
