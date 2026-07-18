import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import colorsData from "@/data/colors.json";

interface ShareCardColor {
  code: string;
  defaultName: string;
  hex: string;
  secondaryColor: string;
}

const shareRoot = path.resolve(process.cwd(), "public", "share");
const defaultColors = (colorsData as { colors: ShareCardColor[] }).colors;
const siteUrl = "https://ashbringer4eg.github.io/satisfactory-tools";

const getPagePath = (code: string, mode: "one" | "two") =>
  path.join(shareRoot, code, `${mode}.html`);

const getCardPath = (code: string, mode: "one" | "two") =>
  path.join(shareRoot, "cards", `${code}-${mode}.png`);

const appModes = ["solo", "duo", "own"] as const;

describe("generated Discord share cards", () => {
  it("has one-color and two-color pages and images for every default item", () => {
    for (const color of defaultColors) {
      expect(existsSync(getPagePath(color.code, "one")), color.code).toBe(true);
      expect(existsSync(getPagePath(color.code, "two")), color.code).toBe(true);
      expect(existsSync(getCardPath(color.code, "one")), color.code).toBe(true);
      expect(existsSync(getCardPath(color.code, "two")), color.code).toBe(true);
    }
  });

  it("writes fixed OG metadata with mode-specific image paths", () => {
    const color = defaultColors.find(
      (entry) => entry.code === "COLOR_TURBOFUEL",
    );
    expect(color).toBeDefined();
    if (!color) return;

    const encodedCode = encodeURIComponent(color.code);
    const oneHtml = readFileSync(getPagePath(color.code, "one"), "utf-8");
    const twoHtml = readFileSync(getPagePath(color.code, "two"), "utf-8");

    expect(oneHtml).toContain(`${siteUrl}/share/${encodedCode}/one.html`);
    expect(oneHtml).toContain(`${siteUrl}/share/cards/${encodedCode}-one.png`);
    expect(oneHtml).toContain(`Primary ${color.hex.toUpperCase()}`);
    expect(oneHtml).not.toContain("Secondary");
    expect(oneHtml).not.toContain("?mode=");

    expect(twoHtml).toContain(`${siteUrl}/share/${encodedCode}/two.html`);
    expect(twoHtml).toContain(`${siteUrl}/share/cards/${encodedCode}-two.png`);
    expect(twoHtml).toContain(
      `Primary ${color.hex.toUpperCase()} · Secondary ${color.secondaryColor.toUpperCase()}`,
    );
    expect(twoHtml).not.toContain("?mode=");
  });

  it("generates app-mode previews and lists them in the sitemap", () => {
    const sitemap = readFileSync(
      path.resolve(process.cwd(), "public", "sitemap.xml"),
      "utf-8",
    );

    for (const mode of appModes) {
      const pageUrl = `${siteUrl}/${mode}/`;
      const cardPath = path.join(shareRoot, "cards", `mode-${mode}.png`);

      expect(existsSync(cardPath), mode).toBe(true);
      expect(sitemap).toContain(`<loc>${pageUrl}</loc>`);
    }
  });
});
