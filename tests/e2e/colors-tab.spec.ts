import { expect, test, type Page } from "@playwright/test";

const TURBOFUEL_NAME = "Turbofuel";
const TURBOFUEL_HEX = "#d4292e";
const TURBOFUEL_SECONDARY_HEX = "#0d0d0d";
const DEFAULT_COPY_COUNTS_KEY = "ficsit-color-copy-counts";
const OWN_COPY_COUNTS_KEY = "ficsit-color-copy-counts-own";
const OWN_PALETTE_STORAGE_KEY = "ownPalette";
const CATEGORY_ORES = "CATEGORY_ORES";
const CATEGORY_OTHER = "CATEGORY_OTHER";

const desktopSearchInput = (page: Page) =>
  page.locator("[data-testid='colors-search-input']:visible").first();

const getSoloSwatchByName = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`Copy hex code .* for ${name}$`, "i") });

const getDuoPrimarySwatchByName = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`Copy primary hex code .* for ${name}$`, "i") });

const getDuoSecondarySwatchByName = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`Copy secondary hex code .* for ${name}$`, "i") });

const getFirstSoloSwatch = (page: Page) =>
  page.locator("button[aria-label^='Copy hex code']").first();

const getFirstDuoPrimarySwatch = (page: Page) =>
  page.locator("button[aria-label^='Copy primary hex code']").first();

const openDuoTab = async (page: Page) => {
  await page.getByRole("tab", { name: /^DUO$/i }).click();
  await expect(getFirstDuoPrimarySwatch(page)).toBeVisible();
};

const openOwnTab = async (page: Page) => {
  await page.getByRole("tab", { name: /^OWN$/i }).click();
  await expect(
    page.getByRole("button", { name: /^(EDIT|РЕДАГУВАТИ)$/i }),
  ).toBeVisible();
};

const openOwnEdit = async (page: Page) => {
  await openOwnTab(page);
  await page.getByRole("button", { name: /^(EDIT|РЕДАГУВАТИ)$/i }).click();
  await expect(
    page.getByRole("button", { name: /^(ADD_ROW|ДОДАТИ_РЯДОК)$/i }),
  ).toBeVisible();
};

const getOwnViewButton = (page: Page) =>
  page.getByRole("button", { name: /^(VIEW|ПЕРЕГЛЯД)$/i });

const getOwnSaveButton = (page: Page) =>
  page.getByRole("button", { name: /^(SAVE|ЗБЕРЕГТИ)$/i });

const getOwnImportButton = (page: Page) =>
  page.getByRole("button", { name: /^(IMPORT|ІМПОРТ)$/i });

const getOwnExportButton = (page: Page) =>
  page.getByRole("button", { name: /^(EXPORT|ЕКСПОРТ)$/i });

const getOwnAddRowButton = (page: Page) =>
  page.getByRole("button", { name: /^(ADD_ROW|ДОДАТИ_РЯДОК)$/i });

const getOwnClearButton = (page: Page) =>
  page.getByRole("button", { name: /^(CLEAR_ALL|ОЧИСТИТИ_ВСЕ)$/i });

const getOwnResetButton = (page: Page) =>
  page.getByRole("button", {
    name: /^(RESET_TO_DEFAULT|СКИНУТИ_ДО_СТАНДАРТУ)$/i,
  });

const getOwnRows = (page: Page) => page.locator("tbody tr");

const getOwnFirstRowPrimaryInput = (page: Page) =>
  getOwnRows(page).first().getByTestId("own-row-primary-input");

const getOwnFirstRowSecondaryInput = (page: Page) =>
  getOwnRows(page).first().getByTestId("own-row-secondary-input");

const getOwnFirstRowCustomNameInput = (page: Page) =>
  getOwnRows(page).first().getByTestId("own-row-default-name-input");

const getOwnKnownCodeSelectInFirstRow = (page: Page) =>
  getOwnRows(page).first().getByTestId("own-row-code-select");

const encodeBase64Json = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), "utf-8").toString("base64");

test.beforeEach(async ({ page, context }) => {
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
});

test.describe("SOLO tab", () => {
  test("search + category filtering work together", async ({ page }) => {
    await page.goto("/");

    const searchInput = desktopSearchInput(page);
    await searchInput.fill("turbo");
    await expect(page.getByText("Turbo Motor")).toBeVisible();
    await expect(page.getByText("Iron Ore")).toHaveCount(0);

    await page.getByRole("button", { name: /^Ammos\b/i }).click();
    await expect(page.getByText("Turbo Rifle Ammo")).toBeVisible();
    await expect(page.getByText("Turbo Motor")).toHaveCount(0);
  });

  test("copy by clicking swatch + hex manual selection", async ({ page }) => {
    await page.goto("/");

    const swatch = getSoloSwatchByName(page, TURBOFUEL_NAME);
    await swatch.click();

    await expect
      .poll(() => page.evaluate(() => (window as Window & { __lastClipboardText?: string }).__lastClipboardText ?? ""))
      .toBe(TURBOFUEL_HEX);

    const hexCode = swatch.getByLabel(`${TURBOFUEL_NAME} hex code ${TURBOFUEL_HEX}`);
    await hexCode.click();

    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toBe(TURBOFUEL_HEX);
  });

  test("reorder animation runs and item finishes at top", async ({ page }) => {
    await page.goto("/");

    const swatch = getSoloSwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    const floating = page.locator(".pointer-events-none.z-50");
    await expect(floating).toBeVisible();
    await expect(floating).toBeHidden({ timeout: 3000 });
    await expect(getFirstSoloSwatch(page)).toContainText(TURBOFUEL_NAME);
    await expect(getFirstSoloSwatch(page)).toContainText("1x");
  });

  test("counter persistence and reset event work with localStorage", async ({ page }) => {
    await page.goto("/");
    await desktopSearchInput(page).fill("turbofuel");

    const swatch = getSoloSwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    await expect(getSoloSwatchByName(page, TURBOFUEL_NAME)).toContainText("1x", { timeout: 3000 });
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), DEFAULT_COPY_COUNTS_KEY))
      .toContain("\"COLOR_TURBOFUEL\":1");

    await page.reload();
    await expect(getSoloSwatchByName(page, TURBOFUEL_NAME)).toContainText("1x");

    await page.evaluate(() => {
      window.dispatchEvent(new Event("ficsit:reset-copy-counters"));
    });
    await expect(getSoloSwatchByName(page, TURBOFUEL_NAME)).toContainText("0x");
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const value = localStorage.getItem(key);
          return value === null || value === "{}";
        }, DEFAULT_COPY_COUNTS_KEY),
      )
      .toBe(true);
  });
});

test.describe("DUO tab", () => {
  test("search + category filtering work together", async ({ page }) => {
    await page.goto("/");
    await openDuoTab(page);

    const searchInput = desktopSearchInput(page);
    await searchInput.fill("turbo");
    await expect(page.getByText("Turbo Motor")).toBeVisible();
    await expect(page.getByText("Iron Ore")).toHaveCount(0);

    await page.getByRole("button", { name: /^Ammos\b/i }).click();
    await expect(page.getByText("Turbo Rifle Ammo")).toBeVisible();
    await expect(page.getByText("Turbo Motor")).toHaveCount(0);
  });

  test("copy by clicking primary/secondary + hex manual selection", async ({ page }) => {
    await page.goto("/");
    await openDuoTab(page);

    const primarySwatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    await primarySwatch.click();

    await expect
      .poll(() => page.evaluate(() => (window as Window & { __lastClipboardText?: string }).__lastClipboardText ?? ""))
      .toBe(TURBOFUEL_HEX);

    const primaryHexCode = primarySwatch.getByLabel(`${TURBOFUEL_NAME} primary hex code ${TURBOFUEL_HEX}`);
    await primaryHexCode.click();
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toBe(TURBOFUEL_HEX);

    const secondarySwatch = getDuoSecondarySwatchByName(page, TURBOFUEL_NAME);
    await secondarySwatch.click();
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __lastClipboardText?: string }).__lastClipboardText ?? ""))
      .toBe(TURBOFUEL_SECONDARY_HEX);

    const secondaryHexCode = secondarySwatch.getByLabel(`${TURBOFUEL_NAME} secondary hex code ${TURBOFUEL_SECONDARY_HEX}`);
    await secondaryHexCode.click();
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toBe(TURBOFUEL_SECONDARY_HEX);
  });

  test("reorder animation runs and item finishes at top", async ({ page }) => {
    await page.goto("/");
    await openDuoTab(page);

    const swatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    const floating = page.locator(".pointer-events-none.z-50");
    await expect(floating).toBeVisible();
    await expect(floating).toBeHidden({ timeout: 3000 });

    const firstPrimary = getFirstDuoPrimarySwatch(page);
    await expect(firstPrimary).toHaveAttribute("aria-label", /for Turbofuel$/);
    const firstCard = firstPrimary.locator("xpath=ancestor::div[.//button[starts-with(@aria-label,'Copy secondary hex code')]][1]");
    await expect(firstCard).toContainText("1x");
  });

  test("counter persistence and reset event work with localStorage", async ({ page }) => {
    await page.goto("/");
    await openDuoTab(page);
    await desktopSearchInput(page).fill("turbofuel");

    const swatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    const filteredCard = swatch.locator("xpath=ancestor::div[.//button[starts-with(@aria-label,'Copy secondary hex code')]][1]");
    await expect(filteredCard).toContainText("1x", { timeout: 3000 });
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), DEFAULT_COPY_COUNTS_KEY))
      .toContain("\"COLOR_TURBOFUEL\":1");

    await page.reload();
    await openDuoTab(page);
    await desktopSearchInput(page).fill("turbofuel");
    const reloadedSwatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    const reloadedCard = reloadedSwatch.locator("xpath=ancestor::div[.//button[starts-with(@aria-label,'Copy secondary hex code')]][1]");
    await expect(reloadedCard).toContainText("1x");

    await page.evaluate(() => {
      window.dispatchEvent(new Event("ficsit:reset-copy-counters"));
    });
    await expect(reloadedCard).toContainText("0x");
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const value = localStorage.getItem(key);
          return value === null || value === "{}";
        }, DEFAULT_COPY_COUNTS_KEY),
      )
      .toBe(true);
  });
});

test.describe("OWN tab", () => {
  test("EDIT is available from preview and VIEW is available in clean edit mode", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnTab(page);

    const editButton = page.getByRole("button", {
      name: /^(EDIT|РЕДАГУВАТИ)$/i,
    });
    await expect(editButton).toBeVisible();
    await editButton.click();

    await expect(getOwnViewButton(page)).toBeVisible();
    await expect(getOwnSaveButton(page)).toHaveCount(0);
    await expect(editButton).toHaveCount(0);
  });

  test("VIEW is hidden while draft has changes or validation errors and returns after save", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    await expect(getOwnViewButton(page)).toBeVisible();

    const firstPrimary = getOwnFirstRowPrimaryInput(page);
    await firstPrimary.fill("#12345");

    await expect(getOwnViewButton(page)).toHaveCount(0);
    await expect(getOwnSaveButton(page)).toHaveCount(0);
    await expect(
      page.getByText(/invalid primary color format\. Expected #RGB or #RRGGBB\./i),
    ).toBeVisible();

    await firstPrimary.fill("#123456");
    await expect(
      page.getByText(/invalid primary color format\. Expected #RGB or #RRGGBB\./i),
    ).toHaveCount(0);
    await expect(getOwnViewButton(page)).toHaveCount(0);
    await expect(getOwnSaveButton(page)).toBeVisible();

    await getOwnSaveButton(page).click();
    await expect(page.getByText("Palette saved.")).toBeVisible();
    await expect(getOwnViewButton(page)).toBeVisible();
    await expect(getOwnSaveButton(page)).toHaveCount(0);
  });

  test("can add row, clear palette, and reset to default", async ({ page }) => {
    await page.goto("/");
    await openOwnEdit(page);

    const initialCount = await getOwnRows(page).count();
    await getOwnAddRowButton(page).click();
    await expect(getOwnRows(page)).toHaveCount(initialCount + 1);

    await getOwnClearButton(page).click();
    await expect(getOwnRows(page)).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as { colors?: unknown[] };
          return parsed.colors?.length ?? null;
        }, OWN_PALETTE_STORAGE_KEY),
      )
      .toBe(0);

    await getOwnResetButton(page).click();
    await expect(getOwnRows(page)).not.toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as {
            paletteCode?: string;
            colors?: unknown[];
          };
          return {
            paletteCode: parsed.paletteCode,
            count: parsed.colors?.length ?? 0,
          };
        }, OWN_PALETTE_STORAGE_KEY),
      )
      .toMatchObject({
        paletteCode: OWN_PALETTE_STORAGE_KEY,
      });
  });

  test("known rows lock default name, but custom rows allow editing default name", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    await expect(getOwnFirstRowCustomNameInput(page)).toHaveCount(0);

    await getOwnKnownCodeSelectInFirstRow(page).click();
    await page.getByRole("option", { name: /^Write your own$/i }).click();

    const customNameInput = getOwnFirstRowCustomNameInput(page);
    await expect(customNameInput).toBeVisible();
    await customNameInput.fill("Custom Limestone");
    await expect(customNameInput).toHaveValue("Custom Limestone");
  });

  test("hex validation accepts #RGB and #RRGGBB and rejects malformed values", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    const firstPrimary = getOwnFirstRowPrimaryInput(page);

    await firstPrimary.fill("#12345");
    await expect(
      page.getByText(/invalid primary color format\. Expected #RGB or #RRGGBB\./i),
    ).toBeVisible();
    await expect(getOwnSaveButton(page)).toHaveCount(0);

    await firstPrimary.fill("#c64");
    await expect(
      page.getByText(/invalid primary color format\. Expected #RGB or #RRGGBB\./i),
    ).toHaveCount(0);
    await expect(getOwnSaveButton(page)).toBeVisible();

    await firstPrimary.fill("#1a2b3c");
    await expect(getOwnSaveButton(page)).toBeVisible();
  });

  test("secondary color falls back to primary when empty on save", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    await getOwnFirstRowPrimaryInput(page).fill("#112233");
    await getOwnFirstRowSecondaryInput(page).fill("");

    await expect(getOwnSaveButton(page)).toBeVisible();
    await getOwnSaveButton(page).click();

    await expect
      .poll(() =>
        page.evaluate((key) => {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as {
            colors?: Array<{ hex?: string; secondaryColor?: string }>;
          };
          return parsed.colors?.[0] ?? null;
        }, OWN_PALETTE_STORAGE_KEY),
      )
      .toMatchObject({
        hex: "#112233",
        secondaryColor: "#112233",
      });
  });

  test("import handles multiple rows and applies category normalization rules", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    const importPayload = {
      schemaVersion: 1,
      paletteCode: "external-palette",
      colors: [
        {
          code: "COLOR_LIMESTONE",
          defaultName: "Limestone",
          hex: "#123456",
          secondaryColor: "#654321",
          categories: [CATEGORY_OTHER],
        },
        {
          defaultName: "My Custom Color",
          hex: "#0f0",
          secondaryColor: "",
          categories: [CATEGORY_ORES],
        },
      ],
    };

    await getOwnImportButton(page).click();
    await page.getByTestId("own-import-base64-input").fill(encodeBase64Json(importPayload));
    await page.getByTestId("own-import-load-button").click();

    await expect(
      page.getByRole("dialog", { name: /Import Base64/i }),
    ).toHaveCount(0);
    await expect(page.getByText("Import loaded into draft. Click SAVE to apply.")).toBeVisible();
    await expect(getOwnRows(page)).toHaveCount(2);
    await expect(getOwnSaveButton(page)).toBeVisible();

    await getOwnSaveButton(page).click();

    await expect
      .poll(() =>
        page.evaluate((key) => {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as {
            paletteCode?: string;
            colors?: Array<{
              code?: string;
              defaultName?: string;
              categories?: string[];
            }>;
          };
          return parsed;
        }, OWN_PALETTE_STORAGE_KEY),
      )
      .toMatchObject({
        paletteCode: OWN_PALETTE_STORAGE_KEY,
      });

    const categoriesSnapshot = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        colors?: Array<{
          code?: string;
          defaultName?: string;
          categories?: string[];
        }>;
      };
      return parsed.colors ?? [];
    }, OWN_PALETTE_STORAGE_KEY);

    const known = categoriesSnapshot?.find((entry) => entry.code === "COLOR_LIMESTONE");
    const custom = categoriesSnapshot?.find((entry) => entry.defaultName === "My Custom Color");

    expect(known?.categories).toEqual([CATEGORY_ORES]);
    expect(custom?.categories).toEqual([CATEGORY_OTHER]);
  });

  test("export is blocked by unsaved changes/errors and works after save", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    await expect(getOwnExportButton(page)).toBeEnabled();

    await getOwnAddRowButton(page).click();
    await expect(
      page.getByText(
        "To export or preview colors you need to fix errors and save this draft",
      ),
    ).toBeVisible();
    await expect(getOwnExportButton(page)).toBeDisabled();

    const firstRow = getOwnRows(page).first();
    await firstRow.getByTestId("own-row-code-select").click();
    await page.getByRole("option", { name: /^Write your own$/i }).click();
    await firstRow
      .getByTestId("own-row-default-name-input")
      .fill("Draft Export Color");
    await firstRow.getByTestId("own-row-primary-input").fill("#224466");
    await firstRow
      .getByTestId("own-row-secondary-input")
      .fill("");

    await expect(getOwnSaveButton(page)).toBeVisible();
    await expect(getOwnExportButton(page)).toBeDisabled();

    await getOwnSaveButton(page).click();
    await expect(getOwnExportButton(page)).toBeEnabled();

    await getOwnExportButton(page).click();
    await expect(page.getByRole("dialog", { name: /Export \(Saved Palette\)/i })).toBeVisible();

    const exportValue = await page
      .getByTestId("own-export-base64-output")
      .inputValue();
    expect(exportValue.length).toBeGreaterThan(0);

    await page.getByTestId("own-export-copy-button").click();

    await expect(
      page.getByRole("dialog", { name: /Export \(Saved Palette\)/i }),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __lastClipboardText?: string }).__lastClipboardText ?? "",
        ),
      )
      .toBe(exportValue);
  });

  test("use mode keeps copy counters in dedicated own storage key", async ({ page }) => {
    await page.goto("/");
    await openOwnTab(page);
    await desktopSearchInput(page).fill("turbofuel");

    const swatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), OWN_COPY_COUNTS_KEY))
      .toContain("\"COLOR_TURBOFUEL\":1");
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), DEFAULT_COPY_COUNTS_KEY))
      .not.toContain("\"COLOR_TURBOFUEL\":1");
  });

  test("edit mode validates import and applies secondary fallback on save", async ({ page }) => {
    await page.goto("/");
    await openOwnEdit(page);

    const saveButton = getOwnSaveButton(page);
    const viewButton = getOwnViewButton(page);
    const openImportButton = getOwnImportButton(page);
    await expect(saveButton).toHaveCount(0);
    await expect(viewButton).toBeVisible();

    await openImportButton.click();
    await page.getByTestId("own-import-base64-input").fill("%%%");
    await page.getByTestId("own-import-load-button").click();
    await expect(page.getByText("Malformed base64 string.")).toBeVisible();
    await expect(saveButton).toHaveCount(0);
    await expect(viewButton).toBeVisible();

    await openImportButton.click();
    await page.getByTestId("own-import-base64-input").fill("");
    await page.getByRole("button", { name: /^Close$/i }).click();
    await expect(saveButton).toHaveCount(0);
    await expect(viewButton).toBeVisible();

    const firstPrimary = page.getByTestId("own-row-primary-input").first();
    const firstSecondary = page.getByTestId("own-row-secondary-input").first();
    await firstPrimary.fill("#112233");
    await firstSecondary.fill("");
    await expect(saveButton).toBeVisible();
    await expect(viewButton).toHaveCount(0);
    await saveButton.click();

    await expect(page.getByText("Palette saved.")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as { colors?: Array<{ hex?: string; secondaryColor?: string }> };
          return parsed.colors?.[0] ?? null;
        }, OWN_PALETTE_STORAGE_KEY),
      )
      .toMatchObject({
        hex: "#112233",
        secondaryColor: "#112233",
      });
  });
});
