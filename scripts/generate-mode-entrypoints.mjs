import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appModes, siteUrl } from "./mode-share-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.resolve(__dirname, "..", "dist");

const replaceMetaContent = (html, selector, content) => {
  const pattern = new RegExp(
    `(<meta\\s+${selector}\\s+content=")[^"]*("\\s*/>)`,
  );
  if (!pattern.test(html)) throw new Error(`Missing metadata: ${selector}`);
  return html.replace(pattern, `$1${content}$2`);
};

const createModeHtml = (baseHtml, mode) => {
  const pageUrl = `${siteUrl}/${mode.id}/`;
  const imageUrl = `${siteUrl}/share/cards/mode-${mode.id}.png`;
  let html = baseHtml
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${pageUrl}" />`,
    )
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${mode.title} | Satisfactory Color Tools</title>`,
    );

  html = replaceMetaContent(html, 'name="description"', mode.description);
  html = replaceMetaContent(html, 'property="og:title"', mode.title);
  html = replaceMetaContent(html, 'property="og:description"', mode.description);
  html = replaceMetaContent(html, 'property="og:url"', pageUrl);
  html = replaceMetaContent(html, 'property="og:image"', imageUrl);
  html = replaceMetaContent(html, 'property="og:image:secure_url"', imageUrl);
  html = replaceMetaContent(html, 'property="og:image:alt"', `${mode.title} preview`);
  html = replaceMetaContent(html, 'name="twitter:title"', mode.title);
  html = replaceMetaContent(html, 'name="twitter:description"', mode.description);
  html = replaceMetaContent(html, 'name="twitter:image"', imageUrl);
  html = replaceMetaContent(html, 'name="twitter:image:alt"', `${mode.title} preview`);
  return html;
};

const baseHtml = await readFile(path.join(distRoot, "index.html"), "utf-8");
await Promise.all(appModes.map(async (mode) => {
  const modeRoot = path.join(distRoot, mode.id);
  await mkdir(modeRoot, { recursive: true });
  await writeFile(
    path.join(modeRoot, "index.html"),
    createModeHtml(baseHtml, mode),
    "utf-8",
  );
}));

console.log(`Generated ${appModes.length} mode entrypoints.`);
