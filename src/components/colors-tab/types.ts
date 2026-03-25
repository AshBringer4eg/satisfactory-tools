import type { ColorCode, SatisfactoryColor } from "@/data/colors";

export type CopyCounts = Record<string, number>;

export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type FloatingMove = {
  colorCode: ColorCode;
  color: SatisfactoryColor;
  targetIndex: number;
  fromRect: Rect;
  toRect: Rect | null;
};

export type ReorderCommit = {
  colorCode: ColorCode;
  color: SatisfactoryColor;
  sourceIndex: number;
  targetIndex: number;
};

export type GridToken =
  | { kind: "color"; color: SatisfactoryColor }
  | { kind: "placeholder"; key: string };

export type CategoryFilterOption = {
  code: string;
  label: string;
};
