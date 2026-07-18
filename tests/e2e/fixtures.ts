import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { setupClipboardMock } from "./helpers/colors-tab";

export { expect };

const normalizeAppBasePath = (basePath: string): string => {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
};

export const appOrigin =
  process.env.PLAYWRIGHT_APP_ORIGIN ?? "http://127.0.0.1:4173";

export const appBasePath = normalizeAppBasePath(
  process.env.PLAYWRIGHT_APP_BASE_PATH ?? "/satisfactory-tools",
);

const toAppPath = (url: string): string => {
  if (!appBasePath || !url.startsWith("/") || url.startsWith("//")) {
    return url;
  }

  if (url === appBasePath || url.startsWith(`${appBasePath}/`)) {
    return url;
  }

  return `${appBasePath}${url}`;
};

const prefixAppNavigation = (page: Page) => {
  const originalGoto = page.goto.bind(page);

  page.goto = ((url: string, options?: Parameters<Page["goto"]>[1]) =>
    originalGoto(toAppPath(url), options)) as Page["goto"];
};

export const getExpectedShareCardUrl = (
  colorCode: string,
  mode: "one" | "two",
): string =>
  new URL(
    toAppPath(`/share/${encodeURIComponent(colorCode)}/${mode}.html`),
    appOrigin,
  ).toString();

export const test = base.extend({
  page: async ({ page, context }, run) => {
    prefixAppNavigation(page);
    await setupClipboardMock(context, page);
    await run(page);
  },
});
