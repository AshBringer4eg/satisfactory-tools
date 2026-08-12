import { expect, test } from "./fixtures";
import { ACCESSIBILITY_SETTINGS_KEY } from "./helpers/colors-tab";

test.describe("tutorial foundation", () => {
  test("starts query-selected tutorial and preserves unrelated URL state", async ({ page }) => {
    await page.goto("/duo/?view=compact&tutorial=filtering#filters");

    await expect(page).toHaveURL(/\/duo\/\?view=compact#filters$/);
    await expect
      .poll(() =>
        page.evaluate(() => ({
          window: window.scrollY,
          route: document.querySelector<HTMLElement>("[data-route-scroll-container]")?.scrollTop ?? 0,
        })),
      )
      .toEqual({ window: 0, route: 0 });
    await expect(page.locator(".react-joyride__tooltip")).toBeVisible();
    await expect(page.getByText("SEARCH", { exact: true })).toBeVisible();

    const searchInput = page.locator('[data-testid="colors-search-input"]:visible');
    await expect(searchInput).toHaveAttribute("readonly", "");
    await page.getByTestId("tutorial-fill-search").click();
    await expect(searchInput).toHaveValue("packaged");
    await expect(page.getByTestId("filtering-results-grid")).toBeVisible();
    await expect(page.getByText("PACKAGED RESULTS", { exact: true })).toBeVisible();
    await expect(page.getByTestId("category-toggle-CATEGORY_FUELS")).toBeVisible();
    await page
      .locator(".react-joyride__tooltip")
      .getByRole("button", { name: /next/i })
      .click();
    await expect(page.getByText("FUELS CATEGORY", { exact: true })).toBeVisible();
    await page.getByTestId("category-toggle-CATEGORY_FUELS").click();
    await expect(page.getByTestId("filtering-filtered-swatches")).toBeVisible();
    await expect(page.getByText("FILTERED SWATCHES", { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          window: window.scrollY,
          route: document.querySelector<HTMLElement>("[data-route-scroll-container]")?.scrollTop ?? 0,
        })),
      )
      .toEqual({ window: 0, route: 0 });
  });

  test("opens filter drawer for filtering tutorial on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/duo/?tutorial=filtering");

    await page.getByTestId("tutorial-fill-search").click();
    await expect(page.getByText("PACKAGED RESULTS", { exact: true })).toBeVisible();
    await page
      .locator(".react-joyride__tooltip")
      .getByRole("button", { name: /next/i })
      .click();

    await expect(page.getByText("FILTER MENU", { exact: true })).toBeVisible();
    await page.locator('[data-tutorial="filter-menu"]').click();
    await expect(page.getByText("FUELS CATEGORY", { exact: true })).toBeVisible();
    const mobileFuelsCategory = page.locator(
      '[data-testid="category-toggle-CATEGORY_FUELS"]:visible',
    );
    await expect(mobileFuelsCategory).toHaveCount(1);
    await mobileFuelsCategory.click();
    await expect(page.getByText("FILTERED SWATCHES", { exact: true })).toBeVisible();
    await page
      .locator(".react-joyride__tooltip")
      .getByRole("button", { name: /finish/i })
      .click();
    await expect(page.locator(".react-joyride__tooltip")).toHaveCount(0);
    await expect(page.locator('[data-testid="colors-search-input"]:visible')).toHaveValue("");
    await expect(page.getByTestId("category-toggle-CATEGORY_FUELS").first()).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("pastes copied swatch results with clipboard button", async ({ page }) => {
    await page.goto("/duo/?tutorial=swatches");
    await page
      .locator(".react-joyride__tooltip")
      .getByRole("button", { name: /next/i })
      .click();

    await page.locator('[data-tutorial="swatch-primary-copy"]:visible').first().click();
    await expect(page.getByText("PASTE COPIED RESULT", { exact: true })).toBeVisible();
    await page.getByTestId("tutorial-paste-clipboard").click();
    await page.getByTestId("tutorial-paste-next").click();
    await expect(page.getByText("SECONDARY ZONE", { exact: true })).toBeVisible();
    await page.locator('[data-tutorial="swatch-secondary-copy"]:visible').first().click();
    await expect(page.getByText("PASTE COPIED RESULT", { exact: true })).toBeVisible();
    await page.getByTestId("tutorial-paste-clipboard").click();
    await page.getByTestId("tutorial-paste-next").click();
    await expect(page.getByText("USE COUNTER", { exact: true })).toBeVisible();
  });

  test("does not auto-start on ordinary tool visits and exposes four Help entries", async ({ page }) => {
    await page.goto("/duo/");
    await expect(page.locator(".react-joyride__tooltip")).toHaveCount(0);

    const helpTrigger = page.getByTestId("tutorial-help-trigger");
    await expect(helpTrigger).toBeVisible();
    await expect(page.getByTestId("tutorial-swatches-inline-trigger")).toBeVisible();
    await expect(
      page.locator('[data-testid="tutorial-filtering-inline-trigger"]:visible'),
    ).toBeVisible();
    await helpTrigger.click();

    await expect(page.getByTestId("tutorial-help-content")).toBeVisible();
    for (const id of ["swatches", "filtering", "harmony", "accessibility"]) {
      await expect(page.getByTestId(`tutorial-help-${id}`)).toBeVisible();
    }
  });

  test("places mobile filtering tutorial trigger after menu and search", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/duo/");

    const menu = page.locator('[data-tutorial="filter-menu"]');
    const search = page.locator('[data-testid="colors-search-input"]:visible');
    const tutorial = page.locator(
      '[data-testid="tutorial-filtering-inline-trigger"]:visible',
    );
    await expect(tutorial).toBeVisible();

    const [menuBox, searchBox, tutorialBox] = await Promise.all([
      menu.boundingBox(),
      search.boundingBox(),
      tutorial.boundingBox(),
    ]);
    expect(menuBox?.x).toBeLessThan(searchBox?.x ?? 0);
    expect(searchBox?.x).toBeLessThan(tutorialBox?.x ?? 0);
  });

  test("keeps Harmony action visible while Harmony tutorial runs", async ({ page }) => {
    await page.goto("/duo/?tutorial=harmony");

    const harmonyAction = page.getByTestId("swatch-harmony-open").first();
    await expect(page.locator(".react-joyride__tooltip")).toBeVisible();
    await expect
      .poll(() =>
        harmonyAction.evaluate((element) => {
          const style = window.getComputedStyle(element);
          return { opacity: style.opacity, pointerEvents: style.pointerEvents };
        }),
      )
      .toEqual({ opacity: "1", pointerEvents: "auto" });

    await harmonyAction.dispatchEvent("click");
    await expect(page.getByTestId("harmony-dialog")).toBeVisible();

    const modeSelect = page.getByTestId("harmony-mode-select");
    await modeSelect.click();
    await page.getByTestId("harmony-mode-option-triadic").click();
    await expect(modeSelect).toContainText("TRIADIC");
    await expect(page.getByText("COPY SUGGESTION", { exact: true })).toBeVisible();
    await page.locator('[data-tutorial="harmony-suggestion"]:visible').first().click();
    await expect(page.getByText("PASTE COPIED RESULT", { exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __lastClipboardText?: string }).__lastClipboardText))
      .not.toBe("");
    const pasteInput = page.getByTestId("tutorial-paste-input");
    await pasteInput.click();
    await expect(pasteInput).toBeFocused();
    await expect(page.getByTestId("harmony-dialog")).toBeVisible();
    await page.getByTestId("tutorial-paste-clipboard").click();
    await expect(pasteInput).not.toHaveValue("");
    await page.getByTestId("tutorial-paste-next").click();
  });

  test("waits for Accessibility drawer animation before highlighting options", async ({ page }) => {
    await page.goto("/duo/?tutorial=accessibility");
    await expect(page.getByText("OPEN A11Y", { exact: true })).toBeVisible();

    await page.addStyleTag({
      content:
        '[data-testid="accessibility-menu-content"][data-state="open"] { animation-duration: 1200ms !important; }',
    });
    await page.getByTestId("accessibility-menu-trigger").click();
    await expect(page.getByTestId("accessibility-menu-content")).toBeVisible();
    await expect(page.getByText("OPEN A11Y", { exact: true })).toBeVisible({
      timeout: 250,
    });
    await expect(page.getByText("VISION MODE", { exact: true })).toBeVisible({
      timeout: 4000,
    });
    await page.getByTestId("accessibility-mode-protan").click();
    await expect(page.getByText("SYMBOLS", { exact: true })).toBeVisible();
    await page.getByTestId("accessibility-symbols-toggle").click();
    await expect(page.getByText("PATTERNS", { exact: true })).toBeVisible();
    await page.getByTestId("accessibility-patterns-toggle").click();
    await expect(page.getByText("RESET ACCESSIBILITY", { exact: true })).toBeVisible();
    await expect(page.locator('[data-tutorial="swatches-grid"]')).toBeVisible();

    await page.getByTestId("tutorial-reset-accessibility").click();
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), ACCESSIBILITY_SETTINGS_KEY))
      .toBe(JSON.stringify({ visionMode: "normal", showSymbols: false, showPatterns: false }));
    await expect(page.locator(".react-joyride__tooltip")).toBeVisible();
    await page.getByTestId("tutorial-apply-accessibility").click();
    await expect(page.locator(".react-joyride__tooltip")).toHaveCount(0);
  });
});
