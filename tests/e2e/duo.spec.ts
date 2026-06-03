import { expect, getExpectedShareCardUrl, test } from "./fixtures";
import {
  DEFAULT_COPY_COUNTS_KEY,
  TURBOFUEL_CODE,
  TURBOFUEL_HEX,
  TURBOFUEL_NAME,
  TURBOFUEL_SECONDARY_HEX,
  desktopSearchInput,
  getDuoPrimarySwatchByName,
  getDuoSecondarySwatchByName,
  getFirstDuoPrimarySwatch,
  getShareButtonByName,
  openDuoTab,
} from "./helpers/colors-tab";

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

  test("copy by clicking primary/secondary + hex manual selection", async ({
    page,
  }) => {
    await page.goto("/");
    await openDuoTab(page);

    const primarySwatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    await primarySwatch.click();

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as Window & { __lastClipboardText?: string })
                .__lastClipboardText ?? "",
          ),
      )
      .toBe(TURBOFUEL_HEX);

    const primaryHexCode = primarySwatch.getByLabel(
      `${TURBOFUEL_NAME} primary hex code ${TURBOFUEL_HEX}`,
    );
    await primaryHexCode.click();
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toBe(TURBOFUEL_HEX);

    const secondarySwatch = getDuoSecondarySwatchByName(page, TURBOFUEL_NAME);
    await secondarySwatch.click();
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as Window & { __lastClipboardText?: string })
                .__lastClipboardText ?? "",
          ),
      )
      .toBe(TURBOFUEL_SECONDARY_HEX);

    const secondaryHexCode = secondarySwatch.getByLabel(
      `${TURBOFUEL_NAME} secondary hex code ${TURBOFUEL_SECONDARY_HEX}`,
    );
    await secondaryHexCode.click();
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toBe(TURBOFUEL_SECONDARY_HEX);
  });

  test("copies Discord share link for a duo swatch", async ({ page }) => {
    await page.goto("/");
    await openDuoTab(page);

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

  test("reorder animation runs and item finishes at top", async ({ page }) => {
    await page.goto("/");
    await openDuoTab(page);

    const swatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    const floating = page.getByTestId("floating-reorder-swatch");
    await expect(floating).toBeVisible();
    await expect(floating).toBeHidden({ timeout: 3000 });

    const firstPrimary = getFirstDuoPrimarySwatch(page);
    await expect(firstPrimary).toHaveAttribute("aria-label", /for Turbofuel$/);
    const firstCard = firstPrimary.locator(
      "xpath=ancestor::div[.//button[starts-with(@aria-label,'Copy secondary hex code')]][1]",
    );
    await expect(firstCard).toContainText("1x");
  });

  test("counter persistence and reset event work with localStorage", async ({
    page,
  }) => {
    await page.goto("/");
    await openDuoTab(page);
    await desktopSearchInput(page).fill("turbofuel");

    const swatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    const filteredCard = swatch.locator(
      "xpath=ancestor::div[.//button[starts-with(@aria-label,'Copy secondary hex code')]][1]",
    );
    await expect(filteredCard).toContainText("1x", { timeout: 3000 });
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), DEFAULT_COPY_COUNTS_KEY))
      .toContain("\"COLOR_TURBOFUEL\":1");

    await page.reload();
    await openDuoTab(page);
    await desktopSearchInput(page).fill("turbofuel");
    const reloadedSwatch = getDuoPrimarySwatchByName(page, TURBOFUEL_NAME);
    const reloadedCard = reloadedSwatch.locator(
      "xpath=ancestor::div[.//button[starts-with(@aria-label,'Copy secondary hex code')]][1]",
    );
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
