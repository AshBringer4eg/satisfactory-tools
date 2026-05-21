import type { BrowserContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const TURBOFUEL_NAME = "Turbofuel";
export const TURBOFUEL_HEX = "#d4292e";
export const TURBOFUEL_SECONDARY_HEX = "#0d0d0d";
export const DEFAULT_COPY_COUNTS_KEY = "ficsit-color-copy-counts";
export const OWN_COPY_COUNTS_KEY = "ficsit-color-copy-counts-own";
export const OWN_PALETTE_STORAGE_KEY = "ownPalette";
export const ACCESSIBILITY_SETTINGS_KEY = "ficsit-accessibility-settings";
export const CATEGORY_ORES = "CATEGORY_ORES";
export const CATEGORY_OTHER = "CATEGORY_OTHER";

export const desktopSearchInput = (page: Page) =>
  page.locator("[data-testid='colors-search-input']:visible").first();

export const getSoloSwatchByName = (page: Page, name: string) =>
  page.getByRole("button", {
    name: new RegExp(`Copy hex code .* for ${name}$`, "i"),
  });

export const getDuoPrimarySwatchByName = (page: Page, name: string) =>
  page.getByRole("button", {
    name: new RegExp(`Copy primary hex code .* for ${name}$`, "i"),
  });

export const getDuoSecondarySwatchByName = (page: Page, name: string) =>
  page.getByRole("button", {
    name: new RegExp(`Copy secondary hex code .* for ${name}$`, "i"),
  });

export const getShareButtonByName = (page: Page, name: string) =>
  page.getByRole("button", {
    name: new RegExp(`Copy Discord share link for ${name}$`, "i"),
  });

export const getFirstSoloSwatch = (page: Page) =>
  page.locator("button[aria-label^='Copy hex code']").first();

export const getFirstDuoPrimarySwatch = (page: Page) =>
  page.locator("button[aria-label^='Copy primary hex code']").first();

export const openDuoTab = async (page: Page) => {
  await page.getByRole("tab", { name: /^DUO$/i }).click();
  await expect(getFirstDuoPrimarySwatch(page)).toBeVisible();
};

export const openOwnTab = async (page: Page) => {
  await page.getByRole("tab", { name: /^OWN$/i }).click();
  await expect(
    page.getByRole("button", { name: /^(EDIT|РЕДАГУВАТИ)$/i }),
  ).toBeVisible();
};

export const openOwnEdit = async (page: Page) => {
  await openOwnTab(page);
  await page.getByRole("button", { name: /^(EDIT|РЕДАГУВАТИ)$/i }).click();
  await expect(
    page.getByRole("button", { name: /^(ADD_ROW|ДОДАТИ_РЯДОК)$/i }),
  ).toBeVisible();
};

export const getOwnViewButton = (page: Page) =>
  page.getByRole("button", { name: /^(VIEW|ПЕРЕГЛЯД)$/i });

export const getOwnSaveButton = (page: Page) =>
  page.getByRole("button", { name: /^(SAVE|ЗБЕРЕГТИ)$/i });

export const getOwnImportButton = (page: Page) =>
  page.getByRole("button", { name: /^(IMPORT|ІМПОРТ)$/i });

export const getOwnExportButton = (page: Page) =>
  page.getByRole("button", { name: /^(EXPORT|ЕКСПОРТ)$/i });

export const getOwnAddRowButton = (page: Page) =>
  page.getByRole("button", { name: /^(ADD_ROW|ДОДАТИ_РЯДОК)$/i });

export const getOwnClearButton = (page: Page) =>
  page.getByRole("button", { name: /^(CLEAR_ALL|ОЧИСТИТИ_ВСЕ)$/i });

export const getOwnResetButton = (page: Page) =>
  page.getByRole("button", {
    name: /^(RESET_TO_DEFAULT|СКИНУТИ_ДО_СТАНДАРТУ)$/i,
  });

export const getOwnRows = (page: Page) => page.locator("tbody tr");

export const getOwnFirstRowPrimaryInput = (page: Page) =>
  getOwnRows(page).first().getByTestId("own-row-primary-input");

export const getOwnFirstRowSecondaryInput = (page: Page) =>
  getOwnRows(page).first().getByTestId("own-row-secondary-input");

export const getOwnFirstRowCustomNameInput = (page: Page) =>
  getOwnRows(page).first().getByTestId("own-row-default-name-input");

export const getOwnKnownCodeSelectInFirstRow = (page: Page) =>
  getOwnRows(page).first().getByTestId("own-row-code-select");

export const encodeBase64Json = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), "utf-8").toString("base64");

export const setupClipboardMock = async (
  context: BrowserContext,
  page: Page,
) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    let lastClipboardText = "";
    const mockWriteText = async (text: string) => {
      lastClipboardText = text;
    };

    Object.defineProperty(window, "__lastClipboardText", {
      get() {
        return lastClipboardText;
      },
      configurable: true,
    });

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      configurable: true,
    });
  });
};
