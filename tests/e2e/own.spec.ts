import { expect, getExpectedShareCardUrl, test } from "./fixtures";
import {
  ACCESSIBILITY_SETTINGS_KEY,
  CATEGORY_ORES,
  CATEGORY_OTHER,
  DEFAULT_COPY_COUNTS_KEY,
  OWN_COPY_COUNTS_KEY,
  OWN_PALETTE_STORAGE_KEY,
  TURBOFUEL_CODE,
  TURBOFUEL_NAME,
  desktopSearchInput,
  encodeBase64Json,
  getDuoPrimarySwatchByName,
  getOwnAddRowButton,
  getOwnClearButton,
  getOwnExportButton,
  getOwnFirstRowCustomNameInput,
  getOwnFirstRowPrimaryInput,
  getOwnFirstRowSecondaryInput,
  getOwnImportButton,
  getOwnKnownCodeSelectInFirstRow,
  getOwnResetButton,
  getOwnRows,
  getOwnSaveButton,
  getOwnViewButton,
  getShareButtonByName,
  openOwnEdit,
  openOwnTab,
} from "./helpers/colors-tab";

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

  test("code selector hides already used known codes in current draft", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    await getOwnAddRowButton(page).click();

    const firstRowCodeSelect = getOwnRows(page)
      .first()
      .getByTestId("own-row-code-select");
    await firstRowCodeSelect.click();

    await expect(page.getByRole("option")).toHaveCount(1);
    await expect(
      page.getByRole("option", { name: /^Write your own$/i }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    const secondRowCodeSelect = getOwnRows(page)
      .nth(1)
      .getByTestId("own-row-code-select");
    await secondRowCodeSelect.click();
    await page.getByRole("option", { name: /^Write your own$/i }).click();

    await firstRowCodeSelect.click();
    await expect(page.getByRole("option")).toHaveCount(2);
    await expect(
      page.getByRole("option", { name: /^Write your own$/i }),
    ).toBeVisible();
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

  test("hex inputs apply # prefixed mask and keep only hex digits", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    const firstPrimary = getOwnFirstRowPrimaryInput(page);
    const firstSecondary = getOwnFirstRowSecondaryInput(page);

    await firstPrimary.fill("12abgg9988");
    await expect(firstPrimary).toHaveValue("#12ab99");

    await firstSecondary.fill("abcd");
    await expect(firstSecondary).toHaveValue("#abcd");

    await firstSecondary.fill("   ");
    await expect(firstSecondary).toHaveValue("");
  });

  test("header assist settings apply to OWN edit picker swatches", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("accessibility-menu-trigger").click();
    await page.getByTestId("accessibility-mode-deutan").click();
    await page.getByTestId("accessibility-symbols-toggle").click();
    await page.getByTestId("accessibility-patterns-toggle").click();
    await page.keyboard.press("Escape");

    await openOwnEdit(page);
    await getOwnFirstRowPrimaryInput(page).fill("#00ff00");
    await getOwnFirstRowSecondaryInput(page).fill("");

    const primaryPickerTrigger = page
      .getByTestId("own-row-primary-input-picker-trigger")
      .first();
    const secondaryPickerTrigger = page
      .getByTestId("own-row-secondary-input-picker-trigger")
      .first();
    const primaryPickerSwatch = primaryPickerTrigger.getByTestId(
      "own-row-primary-input-picker-selected-swatch",
    );
    const secondaryPickerSwatch = secondaryPickerTrigger.getByTestId(
      "own-row-secondary-input-picker-selected-swatch",
    );

    await expect(primaryPickerSwatch).toBeVisible();
    await expect(secondaryPickerSwatch).toBeVisible();
    await expect(
      primaryPickerTrigger.getByTestId("swatch-symbol-overlay"),
    ).toBeVisible();
    await expect(
      primaryPickerTrigger.getByTestId("swatch-pattern-overlay"),
    ).toBeVisible();
    await expect(
      secondaryPickerTrigger.getByTestId("swatch-symbol-overlay"),
    ).toBeVisible();
    await expect
      .poll(() =>
        primaryPickerSwatch.evaluate((element) =>
          window.getComputedStyle(element).backgroundColor,
        ),
      )
      .not.toBe("rgb(0, 255, 0)");
    await expect
      .poll(async () => {
        const primaryColor = await primaryPickerSwatch.evaluate((element) =>
          window.getComputedStyle(element).backgroundColor,
        );
        const secondaryColor = await secondaryPickerSwatch.evaluate((element) =>
          window.getComputedStyle(element).backgroundColor,
        );
        return secondaryColor === primaryColor;
      })
      .toBe(true);
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), ACCESSIBILITY_SETTINGS_KEY))
      .toContain("\"visionMode\":\"deutan\"");
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
    await page
      .getByTestId("own-import-base64-input")
      .fill(encodeBase64Json(importPayload));
    await page.getByTestId("own-import-load-button").click();

    await expect(
      page.getByRole("dialog", { name: /Import Base64/i }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Import loaded into draft. Click SAVE to apply."),
    ).toBeVisible();
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

    const known = categoriesSnapshot?.find(
      (entry) => entry.code === "COLOR_LIMESTONE",
    );
    const custom = categoriesSnapshot?.find(
      (entry) => entry.defaultName === "My Custom Color",
    );

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
    await firstRow.getByTestId("own-row-default-name-input").fill("Draft Export Color");
    await firstRow.getByTestId("own-row-primary-input").fill("#224466");
    await firstRow.getByTestId("own-row-secondary-input").fill("");

    await expect(getOwnSaveButton(page)).toBeVisible();
    await expect(getOwnExportButton(page)).toBeDisabled();

    await getOwnSaveButton(page).click();
    await expect(getOwnExportButton(page)).toBeEnabled();

    await getOwnExportButton(page).click();
    await expect(
      page.getByRole("dialog", { name: /Export \(Saved Palette\)/i }),
    ).toBeVisible();

    const exportValue = await page.getByTestId("own-export-base64-output").inputValue();
    expect(exportValue.length).toBeGreaterThan(0);

    await page.getByTestId("own-export-copy-button").click();

    await expect(
      page.getByRole("dialog", { name: /Export \(Saved Palette\)/i }),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __lastClipboardText?: string })
              .__lastClipboardText ?? "",
        ),
      )
      .toBe(exportValue);
  });

  test("export from fresh edit mode provides default saved palette", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnEdit(page);

    await expect(getOwnExportButton(page)).toBeEnabled();
    await getOwnExportButton(page).click();
    await expect(
      page.getByRole("dialog", { name: /Export \(Saved Palette\)/i }),
    ).toBeVisible();

    const exportValue = await page
      .getByTestId("own-export-base64-output")
      .inputValue();
    expect(exportValue.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: /^Close$/i }).click();
    await expect(
      page.getByRole("dialog", { name: /Export \(Saved Palette\)/i }),
    ).toHaveCount(0);
  });

  test("use mode keeps copy counters in dedicated own storage key", async ({
    page,
  }) => {
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

  test("use mode copies Discord share links for built-in colors", async ({
    page,
  }) => {
    await page.goto("/");
    await openOwnTab(page);
    await desktopSearchInput(page).fill("turbofuel");

    await getDuoPrimarySwatchByName(page, TURBOFUEL_NAME).hover();
    await getShareButtonByName(page, TURBOFUEL_NAME).click({ force: true });

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as Window & { __lastClipboardText?: string })
                .__lastClipboardText ?? "",
          ),
      )
      .toBe(getExpectedShareCardUrl(TURBOFUEL_CODE, "two"));
  });

  test("edit mode validates import and applies secondary fallback on save", async ({
    page,
  }) => {
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
});
