import { expect, test } from "./fixtures";
import { desktopSearchInput } from "./helpers/colors-tab";

test.describe("i18n", () => {
  test("Ukrainian locale localizes OWN tab edit controls", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-uk").click();
    await page.getByRole("tab", { name: /^OWN$/i }).click();

    const editButtonUa = page.getByRole("button", {
      name: /^РЕДАГУВАТИ$/i,
    });
    await expect(editButtonUa).toBeVisible();
    await editButtonUa.click();

    await expect(
      page.getByRole("button", { name: /^ДОДАТИ_РЯДОК$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^ОЧИСТИТИ_ВСЕ$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^СКИНУТИ_ДО_СТАНДАРТУ$/i }),
    ).toBeVisible();
  });

  test("search field aria label follows locale switch", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-uk").click();
    await expect(desktopSearchInput(page)).toHaveAttribute(
      "aria-label",
      /Пошук серед \d+ кольорів/i,
    );

    await page.getByTestId("language-en").click();
    await expect(desktopSearchInput(page)).toHaveAttribute(
      "aria-label",
      /Search \d+ colours/i,
    );
  });
});
