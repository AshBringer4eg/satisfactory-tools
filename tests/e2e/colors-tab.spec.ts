import { expect, test, type Page } from "@playwright/test";

const TURBOFUEL_NAME = "Turbofuel";
const TURBOFUEL_HEX = "#d4292e";

const desktopSearchInput = (page: Page) =>
  page.locator("input[placeholder*='Search'][type='text']:visible").first();

const getSwatchByName = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`Copy hex code .* for ${name}$`, "i") });

const getFirstSwatch = (page: Page) =>
  page.locator("button[aria-label^='Copy hex code']").first();

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

  const swatch = getSwatchByName(page, TURBOFUEL_NAME);
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

  const swatch = getSwatchByName(page, TURBOFUEL_NAME);
  await swatch.hover();
  await swatch.click();
  await page.mouse.move(0, 0);

  // During movement, floating element should be visible briefly.
  const floating = page.locator(".pointer-events-none.z-50");
  await expect(floating).toBeVisible();

  // Animation should finish and item should settle at the first spot.
  await expect(floating).toBeHidden({ timeout: 3000 });
  await expect(getFirstSwatch(page)).toContainText(TURBOFUEL_NAME);
  await expect(getFirstSwatch(page)).toContainText("1x");
});

test("counter persistence and reset event work with localStorage", async ({ page }) => {
  await page.goto("/");
  await desktopSearchInput(page).fill("turbofuel");

  const swatch = getSwatchByName(page, TURBOFUEL_NAME);
  await swatch.hover();
  await swatch.click();
  await page.mouse.move(0, 0);

  await expect(getSwatchByName(page, TURBOFUEL_NAME)).toContainText("1x", { timeout: 3000 });
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("ficsit-color-copy-counts")))
    .toContain("\"Turbofuel\":1");

  await page.reload();
  await expect(getSwatchByName(page, TURBOFUEL_NAME)).toContainText("1x");

  await page.evaluate(() => {
    window.dispatchEvent(new Event("ficsit:reset-copy-counters"));
  });
  await expect(getSwatchByName(page, TURBOFUEL_NAME)).toContainText("0x");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const value = localStorage.getItem("ficsit-color-copy-counts");
        return value === null || value === "{}";
      }),
    )
    .toBe(true);
});
