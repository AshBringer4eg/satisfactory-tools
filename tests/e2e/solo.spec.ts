import { expect, test } from "./fixtures";
import {
  ACCESSIBILITY_SETTINGS_KEY,
  DEFAULT_COPY_COUNTS_KEY,
  TURBOFUEL_HEX,
  TURBOFUEL_NAME,
  desktopSearchInput,
  getFirstSoloSwatch,
  getShareButtonByName,
  getSoloSwatchByName,
} from "./helpers/colors-tab";

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
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as Window & { __lastClipboardText?: string })
                .__lastClipboardText ?? "",
          ),
      )
      .toBe(TURBOFUEL_HEX);

    const hexCode = swatch.getByLabel(
      `${TURBOFUEL_NAME} hex code ${TURBOFUEL_HEX}`,
    );
    await hexCode.click();

    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toBe(TURBOFUEL_HEX);
  });

  test("copies Discord share link for a solo swatch", async ({ page }) => {
    await page.goto("/");

    await getSoloSwatchByName(page, TURBOFUEL_NAME).hover();
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
      .toBe("http://127.0.0.1:4173/share/COLOR_TURBOFUEL/one.html");
  });

  test("reorder animation runs and item finishes at top", async ({ page }) => {
    await page.goto("/");

    const swatch = getSoloSwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    const floating = page.getByTestId("floating-reorder-swatch");
    await expect(floating).toBeVisible();
    await expect(floating).toBeHidden({ timeout: 3000 });
    await expect(getFirstSoloSwatch(page)).toContainText(TURBOFUEL_NAME);
    await expect(getFirstSoloSwatch(page)).toContainText("1x");
  });

  test("counter persistence and reset event work with localStorage", async ({
    page,
  }) => {
    await page.goto("/");
    await desktopSearchInput(page).fill("turbofuel");

    const swatch = getSoloSwatchByName(page, TURBOFUEL_NAME);
    await swatch.hover();
    await swatch.click();
    await page.mouse.move(0, 0);

    await expect(getSoloSwatchByName(page, TURBOFUEL_NAME)).toContainText("1x", {
      timeout: 3000,
    });
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

  test("palette accessibility settings persist from the header menu", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByTestId("accessibility-menu-trigger").click();
    await expect(page.getByText("Palette Accessibility")).toBeVisible();
    await expect(page.getByText("Report")).toHaveCount(0);

    await page.getByTestId("accessibility-mode-deutan").click();
    await page.getByTestId("accessibility-symbols-toggle").click();
    await page.getByTestId("accessibility-patterns-toggle").click();

    await expect(page.getByTestId("accessibility-mode-deutan")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("accessibility-symbols-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("accessibility-patterns-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.reload();
    await page.getByTestId("accessibility-menu-trigger").click();

    await expect(page.getByTestId("accessibility-mode-deutan")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("accessibility-symbols-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId("accessibility-patterns-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect
      .poll(() =>
        page.evaluate((key) => localStorage.getItem(key), ACCESSIBILITY_SETTINGS_KEY),
      )
      .toContain("\"visionMode\":\"deutan\"");
  });
});
