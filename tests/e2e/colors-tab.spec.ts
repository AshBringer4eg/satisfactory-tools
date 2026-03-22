import { expect, test, type Page } from "@playwright/test";

const TURBOFUEL_NAME = "Turbofuel";
const TURBOFUEL_HEX = "#d4292e";
const TURBOFUEL_SECONDARY_HEX = "#0d0d0d";

const desktopSearchInput = (page: Page) =>
  page.locator("input[placeholder*='Search'][type='text']:visible").first();

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
  await page.getByRole("button", { name: /^DUO$/i }).click();
  await expect(getFirstDuoPrimarySwatch(page)).toBeVisible();
};

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
      .poll(() => page.evaluate(() => localStorage.getItem("ficsit-color-copy-counts")))
      .toContain("\"Turbofuel\":1");

    await page.reload();
    await expect(getSoloSwatchByName(page, TURBOFUEL_NAME)).toContainText("1x");

    await page.evaluate(() => {
      window.dispatchEvent(new Event("ficsit:reset-copy-counters"));
    });
    await expect(getSoloSwatchByName(page, TURBOFUEL_NAME)).toContainText("0x");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const value = localStorage.getItem("ficsit-color-copy-counts");
          return value === null || value === "{}";
        }),
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
      .poll(() => page.evaluate(() => localStorage.getItem("ficsit-color-copy-counts")))
      .toContain("\"Turbofuel\":1");

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
        page.evaluate(() => {
          const value = localStorage.getItem("ficsit-color-copy-counts");
          return value === null || value === "{}";
        }),
      )
      .toBe(true);
  });
});
