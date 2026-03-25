import { expect, test } from "./fixtures";

test.describe("routing", () => {
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
