import { expect, test } from "./fixtures";

test.describe("landing tutorial carousel", () => {
  test("navigates slides and launches the selected tutorial route", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("landing-tutorial-carousel")).toBeVisible();
    await expect(page.getByTestId("tutorial-preview-swatches")).toHaveAttribute(
      "data-selected",
      "true",
    );

    await page.getByTestId("tutorial-carousel-next").click();
    await expect(page.getByTestId("tutorial-preview-filtering")).toHaveAttribute(
      "data-selected",
      "true",
    );

    const startTutorial = page.getByTestId("tutorial-start-filtering");
    await expect(startTutorial).toHaveAttribute("href", /\/duo\/\?tutorial=filtering$/);
    await startTutorial.click();
    await expect(page).toHaveURL(/\/duo\/\?tutorial=filtering$/);
  });

  test("uses localized copy and routes from the Ukrainian landing page", async ({ page }) => {
    await page.goto("/uk/");

    await expect(
      page.getByRole("heading", { name: "Опануйте кожну можливість" }),
    ).toBeVisible();

    const startTutorial = page.getByTestId("tutorial-start-swatches");
    await expect(startTutorial).toHaveAttribute(
      "href",
      /\/uk\/duo\/\?tutorial=swatches$/,
    );
    await startTutorial.click();
    await expect(page).toHaveURL(/\/uk\/duo\/\?tutorial=swatches$/);
  });
});
