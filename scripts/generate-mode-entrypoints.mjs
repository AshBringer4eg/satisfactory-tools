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

const rootSeo = {
  en: {
    title: "Satisfactory Color Codes & Palette Generator",
    description: "Browse and copy Satisfactory item HEX color codes, preview primary and secondary swatches, and create accessible custom factory palettes.",
  },
  uk: {
    title: "Коди кольорів Satisfactory і генератор палітр",
    description: "Знаходьте й копіюйте HEX-коди кольорів Satisfactory, переглядайте зразки, створюйте власні палітри та перевіряйте доступність кольорів.",
  },
};

const replaceAlternateHref = (html, hreflang, href) => html.replace(
  new RegExp(`(<link\\s+rel="alternate"\\s+hreflang="${hreflang}"\\s+href=")[^"]*("\\s*\\/>)`),
  `$1${href}$2`,
);

const createLocalizedHtml = (baseHtml, { mode = null, locale }) => {
  const localePrefix = locale === "uk" ? "/uk" : "";
  const routeSuffix = mode ? `/${mode.id}/` : "/";
  const pageUrl = `${siteUrl}${localePrefix}${routeSuffix}`;
  const englishUrl = `${siteUrl}${routeSuffix}`;
  const ukrainianUrl = `${siteUrl}/uk${routeSuffix}`;
  const seo = mode
    ? {
        title: locale === "uk" ? mode.ukTitle : mode.title,
        description: locale === "uk" ? mode.ukDescription : mode.description,
      }
    : rootSeo[locale];
  const imageMode = mode?.id ?? "duo";
  const imageUrl = `${siteUrl}/share/cards/mode-${imageMode}.png`;
  let html = baseHtml
    .replace(/<html\s+lang="[^"]*">/, `<html lang="${locale}">`)
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${pageUrl}" />`,
    )
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${seo.title}</title>`,
    );

  html = replaceAlternateHref(html, "en", englishUrl);
  html = replaceAlternateHref(html, "uk", ukrainianUrl);
  html = replaceAlternateHref(html, "x-default", englishUrl);
  html = replaceMetaContent(html, 'name="description"', seo.description);
  html = replaceMetaContent(html, 'property="og:title"', seo.title);
  html = replaceMetaContent(html, 'property="og:description"', seo.description);
  html = replaceMetaContent(html, 'property="og:locale"', locale === "uk" ? "uk_UA" : "en_US");
  html = replaceMetaContent(html, 'property="og:url"', pageUrl);
  html = replaceMetaContent(html, 'property="og:image"', imageUrl);
  html = replaceMetaContent(html, 'property="og:image:secure_url"', imageUrl);
  html = replaceMetaContent(html, 'property="og:image:alt"', `${seo.title} preview`);
  html = replaceMetaContent(html, 'name="twitter:title"', seo.title);
  html = replaceMetaContent(html, 'name="twitter:description"', seo.description);
  html = replaceMetaContent(html, 'name="twitter:image"', imageUrl);
  html = replaceMetaContent(html, 'name="twitter:image:alt"', `${seo.title} preview`);
  const structuredDataPattern = /(<script\s+type="application\/ld\+json">)\s*[\s\S]*?(<\/script>)/;
  const structuredDataMatch = html.match(structuredDataPattern);
  if (!structuredDataMatch) throw new Error("Missing WebApplication structured data");

  const structuredData = JSON.parse(
    structuredDataMatch[0]
      .replace(/^<script\s+type="application\/ld\+json">/, "")
      .replace(/<\/script>$/, ""),
  );
  structuredData.name = mode
    ? locale === "uk" ? mode.ukTitle : mode.schemaName
    : seo.title;
  structuredData.url = pageUrl;
  structuredData.description = mode
    ? locale === "uk" ? mode.ukDescription : mode.schemaDescription
    : seo.description;
  structuredData.inLanguage = locale;
  html = html.replace(
    structuredDataPattern,
    `$1\n${JSON.stringify(structuredData, null, 2)}\n    $2`,
  );
  return html;
};

const baseHtml = await readFile(path.join(distRoot, "index.html"), "utf-8");
const pages = [
  ...appModes.map((mode) => ({ mode, locale: "en" })),
  { mode: null, locale: "uk" },
  ...appModes.map((mode) => ({ mode, locale: "uk" })),
];

await Promise.all(pages.map(async ({ mode, locale }) => {
  const modeRoot = path.join(
    distRoot,
    ...(locale === "uk" ? ["uk"] : []),
    ...(mode ? [mode.id] : []),
  );
  await mkdir(modeRoot, { recursive: true });
  await writeFile(
    path.join(modeRoot, "index.html"),
    createLocalizedHtml(baseHtml, { mode, locale }),
    "utf-8",
  );
}));

console.log(`Generated ${pages.length} localized entrypoints.`);
