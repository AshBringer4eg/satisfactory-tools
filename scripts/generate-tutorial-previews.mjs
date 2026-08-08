import { spawn } from "node:child_process";
import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const previewRoot = path.join(projectRoot, "tmp", "tutorial-previews");
const outputRoot = path.join(projectRoot, "public", "tutorials");
const previewPort = 4174;
const previewOrigin = `http://127.0.0.1:${previewPort}`;
const viteCli = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");

const waitForPreview = async () => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(previewOrigin);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("Timed out waiting for preview server.");
};

const escapeSvg = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const createFrameSvg = ({ number, title, detail }) => {
  const safeTitle = escapeSvg(title);
  const safeDetail = escapeSvg(detail);

  return Buffer.from(`<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#101722" />
      <stop offset="1" stop-color="#06080c" />
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1018" stop-opacity="0" />
      <stop offset="1" stop-color="#0b1018" stop-opacity="0.75" />
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#background)" />
  <rect x="48" y="40" width="1104" height="594" fill="#151922" stroke="#344054" stroke-width="2" />
  <rect x="48" y="40" width="1104" height="7" fill="#f4a34f" />
  <rect x="72" y="76" width="1056" height="486" fill="none" stroke="#f4a34f" stroke-opacity="0.6" stroke-width="2" />
  <rect x="72" y="76" width="1056" height="486" fill="url(#fade)" />
  <rect x="72" y="582" width="1056" height="1" fill="#344054" />
  <text x="72" y="614" fill="#f4a34f" font-family="Consolas, monospace" font-size="17" font-weight="700" letter-spacing="2">${number} // ${safeTitle}</text>
  <text x="1128" y="614" fill="#9aa7bd" text-anchor="end" font-family="Consolas, monospace" font-size="14">${safeDetail}</text>
</svg>`);
};

const createFrameOverlaySvg = ({ number, title, detail }) => {
  const safeTitle = escapeSvg(title);
  const safeDetail = escapeSvg(detail);

  return Buffer.from(`<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1018" stop-opacity="0" />
      <stop offset="1" stop-color="#0b1018" stop-opacity="0.75" />
    </linearGradient>
  </defs>
  <rect x="72" y="76" width="1056" height="486" fill="url(#fade)" />
  <rect x="72" y="76" width="1056" height="486" fill="none" stroke="#f4a34f" stroke-opacity="0.6" stroke-width="2" />
  <rect x="72" y="582" width="1056" height="1" fill="#344054" />
  <text x="72" y="614" fill="#f4a34f" font-family="Consolas, monospace" font-size="17" font-weight="700" letter-spacing="2">${number} // ${safeTitle}</text>
  <text x="1128" y="614" fill="#9aa7bd" text-anchor="end" font-family="Consolas, monospace" font-size="14">${safeDetail}</text>
</svg>`);
};

const composePreview = async ({ id, number, title, detail }) => {
  const sourcePath = path.join(previewRoot, `${id}.png`);
  const outputPath = path.join(outputRoot, `${id}.webp`);
  const screenshot = await sharp(sourcePath)
    .resize({ width: 1056, height: 486, fit: "cover", position: "top" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1200,
      height: 675,
      channels: 4,
      background: "#0b1018",
    },
  })
    .composite([
      { input: createFrameSvg({ number, title, detail }), left: 0, top: 0 },
      { input: screenshot, left: 72, top: 76 },
      { input: createFrameOverlaySvg({ number, title, detail }), left: 0, top: 0 },
    ])
    .webp({ quality: 86, effort: 6 })
    .toFile(outputPath);
};

const createPage = async (browser) => {
  const context = await browser.newContext({
    colorScheme: "dark",
    deviceScaleFactor: 1,
    viewport: { width: 1280, height: 720 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  const page = await context.newPage();
  return { context, page };
};

const screenshotPath = (id) => path.join(previewRoot, `${id}.png`);

const captureSwatches = async (browser) => {
  const { context, page } = await createPage(browser);
  try {
    await page.goto(`${previewOrigin}/duo/`, { waitUntil: "networkidle" });
    const primarySwatches = page.locator(
      "button[aria-label^='Copy primary hex code']:visible",
    );

    await primarySwatches.nth(0).click();
    await primarySwatches.nth(0).click();
    await primarySwatches.nth(1).click();
    await primarySwatches.nth(2).click();
    await page.waitForTimeout(1_600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(1_220, 700);
    await page.screenshot({ path: screenshotPath("swatches") });
  } finally {
    await context.close();
  }
};

const captureFiltering = async (browser) => {
  const { context, page } = await createPage(browser);
  try {
    await page.goto(`${previewOrigin}/duo/`, { waitUntil: "networkidle" });
    await page.getByTestId("category-toggle-CATEGORY_FUELS").click();
    await page.locator("[data-testid='colors-search-input']:visible").fill("Packaged");
    await page.waitForTimeout(750);
    await page.screenshot({ path: screenshotPath("filtering") });
  } finally {
    await context.close();
  }
};

const captureHarmony = async (browser) => {
  const { context, page } = await createPage(browser);
  try {
    await page.goto(`${previewOrigin}/duo/`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='colors-search-input']:visible").fill("Packaged");
    await page.waitForTimeout(750);
    const primarySwatch = page.getByRole("button", {
      name: /Copy primary hex code .* for Packaged Liquid Biofuel/i,
    });
    await primarySwatch.hover();
    await primarySwatch
      .locator("xpath=ancestor::div[contains(@class,'group')][1]")
      .getByTestId("swatch-harmony-open")
      .click();
    await page.getByTestId("harmony-dialog").waitFor();
    await page.getByTestId("harmony-mode-select").click();
    await page.getByTestId("harmony-mode-option-rectangle").click();
    await page.screenshot({ path: screenshotPath("harmony") });
  } finally {
    await context.close();
  }
};

const captureAccessibility = async (browser) => {
  const { context, page } = await createPage(browser);
  try {
    await page.goto(`${previewOrigin}/duo/`, { waitUntil: "networkidle" });
    await page.getByTestId("accessibility-menu-trigger").click();
    await page.getByTestId("accessibility-mode-deutan").click();
    await page.getByTestId("accessibility-symbols-toggle").click();
    await page.getByTestId("accessibility-patterns-toggle").click();
    await page.screenshot({ path: screenshotPath("accessibility") });
  } finally {
    await context.close();
  }
};

const run = async () => {
  await mkdir(previewRoot, { recursive: true });
  await mkdir(outputRoot, { recursive: true });
  await rm(previewRoot, { recursive: true, force: true });
  await mkdir(previewRoot, { recursive: true });

  const preview = spawn(
    process.execPath,
    [viteCli, "preview", "--port", String(previewPort), "--host", "127.0.0.1"],
    {
      cwd: projectRoot,
      stdio: "inherit",
    },
  );

  try {
    await waitForPreview();
    const browser = await chromium.launch({ headless: true });
    try {
      await captureSwatches(browser);
      await captureFiltering(browser);
      await captureHarmony(browser);
      await captureAccessibility(browser);
    } finally {
      await browser.close();
    }

    await composePreview({
      id: "swatches",
      number: "01",
      title: "COPY + REORDER",
      detail: "PRIMARY / SECONDARY / MOST USED",
    });
    await composePreview({
      id: "filtering",
      number: "02",
      title: "SEARCH + FILTER",
      detail: "NAME / HEX / CATEGORY",
    });
    await composePreview({
      id: "harmony",
      number: "03",
      title: "OKLCH HARMONY",
      detail: "ANCHORS / MODES / FACTORY SAFE",
    });
    await composePreview({
      id: "accessibility",
      number: "04",
      title: "ACCESSIBILITY",
      detail: "VISION / SYMBOLS / PATTERNS",
    });
  } finally {
    preview.kill();
  }
};

try {
  await access(path.join(distRoot, "index.html"));
} catch {
  throw new Error("Missing dist output. Run pnpm build before generating tutorial previews.");
}

await run();
