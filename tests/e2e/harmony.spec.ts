import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  TURBOFUEL_HEX,
  TURBOFUEL_NAME,
  TURBOFUEL_SECONDARY_HEX,
  desktopSearchInput,
  getDuoPrimarySwatchByName,
  getSoloSwatchByName,
  openDuoTab,
  openOwnEdit,
  openOwnTab,
} from "./helpers/colors-tab";

type HarmonyMode = {
  code: string;
  label: string;
  expectedSwatches: number;
};

const HARMONY_MODES: HarmonyMode[] = [
  { code: "analogous", label: "ANALOGOUS", expectedSwatches: 3 },
  { code: "complementary", label: "COMPLEMENTARY", expectedSwatches: 2 },
  {
    code: "doubleSplitComplementary",
    label: "DOUBLE_SPLIT_COMPLEMENTARY",
    expectedSwatches: 5,
  },
  { code: "rectangle", label: "RECTANGLE", expectedSwatches: 4 },
  {
    code: "splitComplementary",
    label: "SPLIT_COMPLEMENTARY",
    expectedSwatches: 3,
  },
  { code: "tetradic", label: "TETRADIC", expectedSwatches: 4 },
  { code: "triadic", label: "TRIADIC", expectedSwatches: 3 },
];

const getDialog = (page: Page) => page.getByTestId("harmony-dialog");
const getModeSelect = (page: Page) => page.getByTestId("harmony-mode-select");
const getHarmonySwatches = (page: Page) => page.getByTestId("harmony-swatch");
const getSwatchCard = (swatch: Locator) =>
  swatch.locator("xpath=ancestor::div[contains(@class,'group')][1]");
const getSwatchShareAction = (swatch: Locator) =>
  getSwatchCard(swatch).getByTestId("swatch-share-link");
const getSwatchHarmonyAction = (swatch: Locator) =>
  getSwatchCard(swatch).getByTestId("swatch-harmony-open");
const closeDialog = async (page: Page) => {
  await page.keyboard.press("Escape");
  await expect(getDialog(page)).toHaveCount(0);
};

const expectActionState = async (
  action: Locator,
  expected: "shown" | "hidden",
) => {
  await expect
    .poll(async () =>
      action.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          opacity: style.opacity,
          pointerEvents: style.pointerEvents,
        };
      }),
    )
    .toEqual(
      expected === "shown"
        ? { opacity: "1", pointerEvents: "auto" }
        : { opacity: "0", pointerEvents: "none" },
    );
};

const openHarmonyFromTurbofuelSwatch = async (page: Page, swatch: Locator) => {
  await swatch.hover();
  const harmonyAction = getSwatchHarmonyAction(swatch);
  await harmonyAction.click({ force: true });
  await expect(getDialog(page)).toBeVisible();
};

const expectHarmonySwatchesHaveColors = async (
  page: Page,
  expectedCount: number,
) => {
  await expect(getHarmonySwatches(page)).toHaveCount(expectedCount);

  const backgroundColors = await getHarmonySwatches(page).evaluateAll(
    (swatches) =>
      swatches.map((swatch) => window.getComputedStyle(swatch).backgroundColor),
  );

  expect(backgroundColors).toHaveLength(expectedCount);
  expect(
    backgroundColors.every(
      (color) =>
        color.startsWith("rgb(") &&
        color !== "rgba(0, 0, 0, 0)" &&
        color !== "transparent",
    ),
  ).toBe(true);
};

test.describe("Harmony modal", () => {
  test.describe.configure({ mode: "serial" });

  test("opens from SOLO, DUO, and OWN swatches with swatch colors prefilled", async ({
    page,
  }) => {
    await page.goto("/");
    await desktopSearchInput(page).fill("turbofuel");

    await openHarmonyFromTurbofuelSwatch(
      page,
      getSoloSwatchByName(page, TURBOFUEL_NAME),
    );
    await expect(page.getByTestId("harmony-primary-input")).toHaveValue(
      TURBOFUEL_HEX,
    );
    await expect(page.getByTestId("harmony-secondary-input")).toHaveValue("");
    await closeDialog(page);

    await openDuoTab(page);
    await desktopSearchInput(page).fill("turbofuel");
    await openHarmonyFromTurbofuelSwatch(
      page,
      getDuoPrimarySwatchByName(page, TURBOFUEL_NAME),
    );
    await expect(page.getByTestId("harmony-primary-input")).toHaveValue(
      TURBOFUEL_HEX,
    );
    await expect(page.getByTestId("harmony-secondary-input")).toHaveValue(
      TURBOFUEL_SECONDARY_HEX,
    );
    await closeDialog(page);

    await openOwnTab(page);
    await desktopSearchInput(page).fill("turbofuel");
    await openHarmonyFromTurbofuelSwatch(
      page,
      getDuoPrimarySwatchByName(page, TURBOFUEL_NAME),
    );
    await expect(page.getByTestId("harmony-primary-input")).toHaveValue(
      TURBOFUEL_HEX,
    );
    await expect(page.getByTestId("harmony-secondary-input")).toHaveValue(
      TURBOFUEL_SECONDARY_HEX,
    );
  });

  test("opens from OWN VIEW and EDIT harmony buttons", async ({ page }) => {
    await page.goto("/");
    await openOwnTab(page);

    await page.getByTestId("own-use-harmony-button").click();
    await expect(getDialog(page)).toBeVisible();
    await closeDialog(page);

    await openOwnEdit(page);
    await page.getByTestId("own-edit-harmony-button").click();
    await expect(getDialog(page)).toBeVisible();
  });

  test("all harmony modes render colored suggestion swatches", async ({
    page,
  }) => {
    await page.goto("/");
    await desktopSearchInput(page).fill("turbofuel");
    await openHarmonyFromTurbofuelSwatch(
      page,
      getSoloSwatchByName(page, TURBOFUEL_NAME),
    );

    for (const mode of HARMONY_MODES) {
      await getModeSelect(page).click();
      await page.getByTestId(`harmony-mode-option-${mode.code}`).click();
      await expect(getModeSelect(page)).toContainText(mode.label);
      await expectHarmonySwatchesHaveColors(page, mode.expectedSwatches);
    }
  });

  test("swatch share and harmony actions show on hover and hide after click leaves hover", async ({
    page,
  }) => {
    await page.goto("/");
    await desktopSearchInput(page).fill("turbofuel");

    const swatch = getSoloSwatchByName(page, TURBOFUEL_NAME);
    const shareAction = getSwatchShareAction(swatch);
    const harmonyAction = getSwatchHarmonyAction(swatch);

    await expectActionState(shareAction, "hidden");
    await expectActionState(harmonyAction, "hidden");

    await swatch.hover();
    await shareAction.click({ force: true });
    await page.mouse.move(0, 0);
    await expectActionState(shareAction, "hidden");
    await expectActionState(harmonyAction, "hidden");

    await swatch.hover();
    await harmonyAction.click({ force: true });
    await expect(getDialog(page)).toBeVisible();
    await closeDialog(page);
    await page.mouse.move(0, 0);
    await expectActionState(shareAction, "hidden");
    await expectActionState(harmonyAction, "hidden");
  });

  test("swatch actions are always visible on coarse pointer devices", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const originalMatchMedia = window.matchMedia.bind(window);
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: (query: string) => {
          if (query === "(hover: none), (pointer: coarse)") {
            return {
              matches: true,
              media: query,
              onchange: null,
              addEventListener: () => undefined,
              removeEventListener: () => undefined,
              addListener: () => undefined,
              removeListener: () => undefined,
              dispatchEvent: () => false,
            };
          }

          return originalMatchMedia(query);
        },
      });
    });

    await page.goto("/");
    await desktopSearchInput(page).fill("turbofuel");

    const swatch = getSoloSwatchByName(page, TURBOFUEL_NAME);
    await expectActionState(getSwatchShareAction(swatch), "shown");
    await expectActionState(getSwatchHarmonyAction(swatch), "shown");
  });
});
