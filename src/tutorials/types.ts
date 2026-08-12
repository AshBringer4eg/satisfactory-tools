import type { ReactNode } from "react";
import type { AppTabId } from "@/config/tabs";

export type TutorialId =
  | "swatches"
  | "filtering"
  | "harmony"
  | "accessibility";

export type TutorialAnchor =
  | "tutorial-help"
  | "accessibility-menu"
  | "accessibility-panel"
  | "accessibility-vision-mode"
  | "accessibility-symbols"
  | "accessibility-patterns"
  | "swatches-grid"
  | "swatch-primary-copy"
  | "swatch-secondary-copy"
  | "swatch-copy-counter"
  | "swatch-harmony"
  | "search-input"
  | "filtering-results-grid"
  | "filtering-filtered-swatches"
  | "filtering-category-fuels"
  | "filter-menu"
  | "category-filters"
  | "results-summary"
  | "harmony-dialog"
  | "harmony-mode"
  | "harmony-factory-safe"
  | "harmony-suggestion";

export type TutorialAction =
  | { type: "copy"; zone: "primary" | "secondary" }
  | { type: "search"; value: string }
  | { type: "category"; code?: string }
  | { type: "open-harmony" }
  | { type: "harmony-mode"; mode: string }
  | { type: "factory-safe"; enabled: boolean }
  | { type: "harmony-copy" }
  | { type: "paste-result" }
  | { type: "paste-next" }
  | { type: "open-accessibility" }
  | { type: "open-filter-menu" }
  | { type: "accessibility-drawer"; phase: "start" | "end" }
  | { type: "vision-mode"; mode: string }
  | { type: "toggle-symbols"; enabled: boolean }
  | { type: "toggle-patterns"; enabled: boolean }
  | { type: "reset-accessibility" }
  | { type: "apply-accessibility" };

export type TutorialActionRequirement =
  | { type: "copy"; zone: "primary" | "secondary" }
  | { type: "search"; minLength: number; expectedValue?: string }
  | { type: "category"; code?: string }
  | { type: "open-harmony" }
  | { type: "harmony-mode" }
  | { type: "factory-safe"; enabled: boolean }
  | { type: "harmony-copy" }
  | { type: "paste-result" }
  | { type: "open-accessibility" }
  | { type: "open-filter-menu" }
  | { type: "accessibility-drawer"; phase: "start" | "end" }
  | { type: "vision-mode" }
  | { type: "toggle-symbols"; enabled: boolean }
  | { type: "toggle-patterns"; enabled: boolean }
  | { type: "reset-accessibility" }
  | { type: "apply-accessibility" };

export type TutorialStep = {
  id: string;
  target: TutorialAnchor;
  titleKey: string;
  contentKey: string;
  kind: "info" | "action";
  requirement?: TutorialActionRequirement;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  mobileOnly?: boolean;
  skipScroll?: boolean;
};

export type TutorialDefinition = {
  id: TutorialId;
  mode: AppTabId;
  titleKey: string;
  descriptionKey: string;
  steps: readonly TutorialStep[];
};

export type JoyrideTutorialStep = Omit<
  TutorialStep,
  "titleKey" | "contentKey" | "target" | "mobileOnly"
> & {
  target: string | (() => HTMLElement | null);
  title: ReactNode;
  content: ReactNode;
  buttons: Array<"back" | "skip" | "primary">;
  blockTargetInteraction?: boolean;
  data: {
    requirement?: TutorialActionRequirement;
    kind: TutorialStep["kind"];
  };
};
