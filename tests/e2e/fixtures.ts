import { expect, test as base } from "@playwright/test";
import { setupClipboardMock } from "./helpers/colors-tab";

export { expect };
export const test = base.extend({
  page: async ({ page, context }, run) => {
    await setupClipboardMock(context, page);
    await run(page);
  },
});
