import { expect, test } from "./fixtures";

test.describe("routing", () => {
  test("mode path selects a tab and tab changes update the URL", async ({ page }) => {
    await page.goto("/duo/");

    await expect(page.getByRole("tab", { name: "DUO" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByRole("tab", { name: "OWN" }).click();
    await expect(page).toHaveURL(/\/own\/$/);
  });

  test("unknown route shows not found and can recover to home", async ({ page }) => {
    await page.goto("/definitely-not-a-route");

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    const returnHomeLink = page.getByRole("link", {
      name: /Return to Home|Повернутися на головну/i,
    });
    await expect(returnHomeLink).toBeVisible();

    await returnHomeLink.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("tablist", { name: "Palette tabs" })).toBeVisible();
  });
});
