import type { TutorialAnchor, TutorialDefinition, TutorialId } from "./types";

export const TUTORIAL_IDS = [
  "swatches",
  "filtering",
  "harmony",
  "accessibility",
] as const satisfies readonly TutorialId[];

export const tutorialAnchor = (anchor: TutorialAnchor): string =>
  `[data-tutorial="${anchor}"]`;

const isVisibleTutorialElement = (element: HTMLElement): boolean => {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const styles = window.getComputedStyle(current);
    if (styles.display === "none" || styles.visibility === "hidden") {
      return false;
    }
    current = current.parentElement;
  }
  return true;
};

export const findTutorialTarget = (
  anchor: TutorialAnchor,
): HTMLElement | null => {
  if (typeof document === "undefined") return null;
  return Array.from(document.querySelectorAll<HTMLElement>(tutorialAnchor(anchor)))
    .find(isVisibleTutorialElement) ?? null;
};

export const tutorialCatalog: Record<TutorialId, TutorialDefinition> = {
  swatches: {
    id: "swatches",
    mode: "duo",
    titleKey: "tutorials.items.swatches.title",
    descriptionKey: "tutorials.items.swatches.description",
    steps: [
      {
        id: "swatches-intro",
        target: "swatches-grid",
        titleKey: "tutorials.items.swatches.steps.intro.title",
        contentKey: "tutorials.items.swatches.steps.intro.content",
        kind: "info",
        skipScroll: true,
      },
      {
        id: "swatches-primary-copy",
        target: "swatch-primary-copy",
        titleKey: "tutorials.items.swatches.steps.primary.title",
        contentKey: "tutorials.items.swatches.steps.primary.content",
        kind: "action",
        requirement: { type: "copy", zone: "primary" },
      },
      {
        id: "swatches-primary-paste",
        target: "swatch-primary-copy",
        titleKey: "tutorials.items.swatches.steps.paste.title",
        contentKey: "tutorials.items.swatches.steps.paste.content",
        kind: "action",
        requirement: { type: "paste-result" },
      },
      {
        id: "swatches-secondary-copy",
        target: "swatch-secondary-copy",
        titleKey: "tutorials.items.swatches.steps.secondary.title",
        contentKey: "tutorials.items.swatches.steps.secondary.content",
        kind: "action",
        requirement: { type: "copy", zone: "secondary" },
      },
      {
        id: "swatches-secondary-paste",
        target: "swatch-secondary-copy",
        titleKey: "tutorials.items.swatches.steps.paste.title",
        contentKey: "tutorials.items.swatches.steps.paste.content",
        kind: "action",
        requirement: { type: "paste-result" },
      },
      {
        id: "swatches-counter",
        target: "swatch-copy-counter",
        titleKey: "tutorials.items.swatches.steps.counter.title",
        contentKey: "tutorials.items.swatches.steps.counter.content",
        kind: "info",
      },
    ],
  },
  filtering: {
    id: "filtering",
    mode: "duo",
    titleKey: "tutorials.items.filtering.title",
    descriptionKey: "tutorials.items.filtering.description",
    steps: [
      {
        id: "filtering-search",
        target: "search-input",
        titleKey: "tutorials.items.filtering.steps.search.title",
        contentKey: "tutorials.items.filtering.steps.search.content",
        kind: "action",
        requirement: {
          type: "search",
          minLength: 1,
          expectedValue: "packaged",
        },
      },
      {
        id: "filtering-results-grid",
        target: "filtering-results-grid",
        titleKey: "tutorials.items.filtering.steps.resultsGrid.title",
        contentKey: "tutorials.items.filtering.steps.resultsGrid.content",
        kind: "info",
        skipScroll: true,
      },
      {
        id: "filtering-menu",
        target: "filter-menu",
        titleKey: "tutorials.items.filtering.steps.menu.title",
        contentKey: "tutorials.items.filtering.steps.menu.content",
        kind: "action",
        requirement: { type: "open-filter-menu" },
        mobileOnly: true,
        skipScroll: true,
      },
      {
        id: "filtering-category",
        target: "filtering-category-fuels",
        titleKey: "tutorials.items.filtering.steps.category.title",
        contentKey: "tutorials.items.filtering.steps.category.content",
        kind: "action",
        requirement: { type: "category", code: "CATEGORY_FUELS" },
        skipScroll: true,
      },
      {
        id: "filtering-filtered-swatches",
        target: "filtering-filtered-swatches",
        titleKey: "tutorials.items.filtering.steps.filteredSwatches.title",
        contentKey: "tutorials.items.filtering.steps.filteredSwatches.content",
        kind: "info",
        skipScroll: true,
      },
    ],
  },
  harmony: {
    id: "harmony",
    mode: "duo",
    titleKey: "tutorials.items.harmony.title",
    descriptionKey: "tutorials.items.harmony.description",
    steps: [
      {
        id: "harmony-open",
        target: "swatch-harmony",
        titleKey: "tutorials.items.harmony.steps.open.title",
        contentKey: "tutorials.items.harmony.steps.open.content",
        kind: "action",
        requirement: { type: "open-harmony" },
      },
      {
        id: "harmony-mode",
        target: "harmony-mode",
        titleKey: "tutorials.items.harmony.steps.mode.title",
        contentKey: "tutorials.items.harmony.steps.mode.content",
        kind: "action",
        requirement: { type: "harmony-mode" },
      },
      {
        id: "harmony-copy",
        target: "harmony-suggestion",
        titleKey: "tutorials.items.harmony.steps.copy.title",
        contentKey: "tutorials.items.harmony.steps.copy.content",
        kind: "action",
        requirement: { type: "harmony-copy" },
      },
      {
        id: "harmony-paste",
        target: "harmony-suggestion",
        titleKey: "tutorials.items.harmony.steps.paste.title",
        contentKey: "tutorials.items.harmony.steps.paste.content",
        kind: "action",
        requirement: { type: "paste-result" },
      },
    ],
  },
  accessibility: {
    id: "accessibility",
    mode: "duo",
    titleKey: "tutorials.items.accessibility.title",
    descriptionKey: "tutorials.items.accessibility.description",
    steps: [
      {
        id: "accessibility-open",
        target: "accessibility-menu",
        titleKey: "tutorials.items.accessibility.steps.open.title",
        contentKey: "tutorials.items.accessibility.steps.open.content",
        kind: "action",
        requirement: { type: "accessibility-drawer", phase: "end" },
      },
      {
        id: "accessibility-vision",
        target: "accessibility-vision-mode",
        titleKey: "tutorials.items.accessibility.steps.vision.title",
        contentKey: "tutorials.items.accessibility.steps.vision.content",
        kind: "action",
        requirement: { type: "vision-mode" },
      },
      {
        id: "accessibility-symbols",
        target: "accessibility-symbols",
        titleKey: "tutorials.items.accessibility.steps.symbols.title",
        contentKey: "tutorials.items.accessibility.steps.symbols.content",
        kind: "action",
        requirement: { type: "toggle-symbols", enabled: true },
      },
      {
        id: "accessibility-patterns",
        target: "accessibility-patterns",
        titleKey: "tutorials.items.accessibility.steps.patterns.title",
        contentKey: "tutorials.items.accessibility.steps.patterns.content",
        kind: "action",
        requirement: { type: "toggle-patterns", enabled: true },
      },
      {
        id: "accessibility-reset",
        target: "swatches-grid",
        titleKey: "tutorials.items.accessibility.steps.reset.title",
        contentKey: "tutorials.items.accessibility.steps.reset.content",
        kind: "action",
        requirement: { type: "apply-accessibility" },
        placement: "center",
      },
    ],
  },
};

export const getTutorialDefinition = (id: TutorialId): TutorialDefinition =>
  tutorialCatalog[id];
