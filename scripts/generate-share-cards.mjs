import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { appModes, siteUrl } from "./mode-share-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const colorsPath = path.join(projectRoot, "src", "data", "colors.json");
const shareRoot = path.join(projectRoot, "public", "share");
const cardsRoot = path.join(shareRoot, "cards");
const modePagesRoot = path.join(shareRoot, "modes");
const sitemapPath = path.join(projectRoot, "public", "sitemap.xml");

const shareModes = ["one", "two"];

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeSvg = escapeHtml;

const assertColorCode = (value, index) => {
  if (typeof value !== "string" || !/^(COLOR|LIGHT)_[A-Z0-9_]+$/.test(value)) {
    throw new Error(`Invalid or missing color code at index ${index}.`);
  }
  return value;
};

const assertHex = (value, field, code) => {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`Invalid ${field} for ${code}. Expected #RRGGBB.`);
  }
  return value.toLowerCase();
};

const truncate = (value, maxLength) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;

const ensureShareRoot = async () => {
  await rm(modePagesRoot, { recursive: true, force: true });
  await mkdir(cardsRoot, { recursive: true });
};

export const getSharePagePath = (code, mode) =>
  path.join(shareRoot, code, `${mode}.html`);

export const getShareCardPath = (code, mode) =>
  path.join(cardsRoot, `${code}-${mode}.png`);

export const getSharePageUrl = (code, mode) =>
  `${siteUrl}/share/${encodeURIComponent(code)}/${mode}.html`;

export const getShareCardUrl = (code, mode) =>
  `${siteUrl}/share/cards/${encodeURIComponent(code)}-${mode}.png`;

export const getModeShareCardPath = (mode) =>
  path.join(cardsRoot, `mode-${mode}.png`);

export const getModeSharePageUrl = (mode) =>
  `${siteUrl}/${mode}/`;

const createCardSvg = ({ code, name, primaryHex, secondaryHex, mode }) => {
  const isTwo = mode === "two";
  const title = escapeSvg(truncate(name, 32));
  const safeCode = escapeSvg(code);
  const primary = escapeSvg(primaryHex);
  const secondary = escapeSvg(secondaryHex);
  const subtitle = isTwo
    ? `PRIMARY ${primaryHex.toUpperCase()}  /  SECONDARY ${secondaryHex.toUpperCase()}`
    : `PRIMARY ${primaryHex.toUpperCase()}`;

  const secondaryBlock = isTwo
    ? `<rect x="836" y="188" width="260" height="256" fill="${secondary}" />`
    : "";
  const primaryWidth = isTwo ? 736 : 996;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#121720" />
      <stop offset="1" stop-color="#07090d" />
    </linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0" />
      <stop offset="1" stop-color="#000000" stop-opacity="0.72" />
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="64" y="64" width="1072" height="502" fill="#151922" stroke="#344054" stroke-width="2" filter="url(#softShadow)" />
  <rect x="64" y="64" width="1072" height="7" fill="#f4a34f" />
  <text x="100" y="132" fill="#f4a34f" font-family="Consolas, monospace" font-size="19" font-weight="700" letter-spacing="2">SATISFACTORY COLOR TOOLS</text>
  <text x="100" y="172" fill="#e5ebf5" font-family="Consolas, monospace" font-size="46" font-weight="700">${title}</text>
  <text x="100" y="212" fill="#9aa7bd" font-family="Consolas, monospace" font-size="21">${escapeSvg(subtitle)}</text>
  <g>
    <rect x="100" y="188" width="${primaryWidth}" height="256" fill="${primary}" />
    ${secondaryBlock}
    <rect x="100" y="188" width="996" height="256" fill="url(#shade)" />
    <rect x="100" y="188" width="996" height="256" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2" />
    <text x="126" y="358" fill="#ffffff" font-family="Consolas, monospace" font-size="28" font-weight="700">${escapeSvg(name)}</text>
    <text x="126" y="398" fill="#ffffff" font-family="Consolas, monospace" font-size="23">${primary.toUpperCase()}${isTwo ? `  +  ${secondary.toUpperCase()}` : ""}</text>
  </g>
  <text x="100" y="504" fill="#9aa7bd" font-family="Consolas, monospace" font-size="18">${safeCode}</text>
  <text x="100" y="535" fill="#9aa7bd" font-family="Consolas, monospace" font-size="18">ashbringer4eg.github.io/satisfactory-tools</text>
</svg>`;
};

const createModeCardSvg = ({ id, title, description }) => {
  const samples = [
    ["#ef9f55", "#513a2d"],
    ["#84b8d8", "#253d52"],
    ["#a5cf67", "#3e542d"],
    ["#c58bd8", "#51365d"],
  ];
  const swatches = samples.map(([primary, secondary], index) => {
    const x = 100 + index * 249;
    const primaryWidth = id === "duo" ? 169 : 209;
    const secondaryBlock = id === "duo"
      ? `<rect x="${x + 169}" y="265" width="70" height="154" fill="${secondary}" />`
      : "";
    return `<g>
      <rect x="${x}" y="265" width="239" height="154" fill="#151922" stroke="#ffffff" stroke-opacity="0.15" />
      <rect x="${x}" y="265" width="${primaryWidth}" height="154" fill="${primary}" />
      ${secondaryBlock}
      <rect x="${x}" y="371" width="239" height="48" fill="#000000" fill-opacity="0.55" />
      <text x="${x + 14}" y="401" fill="#ffffff" font-family="Consolas, monospace" font-size="17">COLOR_${index + 1}</text>
    </g>`;
  }).join("\n");
  const ownAccent = id === "own"
    ? `<rect x="100" y="449" width="986" height="46" fill="#1d2430" stroke="#344054" />
       <text x="122" y="479" fill="#f4a34f" font-family="Consolas, monospace" font-size="18">CUSTOM PALETTE  /  OKLCH HARMONY  /  ACCESSIBILITY CHECK</text>`
    : `<text x="100" y="477" fill="#9aa7bd" font-family="Consolas, monospace" font-size="18">CLICK A SWATCH TO COPY HEX  /  SEARCH 167 SATISFACTORY COLORS</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#121720" />
      <stop offset="1" stop-color="#07090d" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="64" y="64" width="1072" height="502" fill="#151922" stroke="#344054" stroke-width="2" />
  <rect x="64" y="64" width="1072" height="7" fill="#f4a34f" />
  <text x="100" y="132" fill="#f4a34f" font-family="Consolas, monospace" font-size="19" font-weight="700" letter-spacing="2">SATISFACTORY COLOR TOOLS</text>
  <text x="100" y="192" fill="#e5ebf5" font-family="Consolas, monospace" font-size="48" font-weight="700">${escapeSvg(title)}</text>
  <text x="100" y="230" fill="#9aa7bd" font-family="Consolas, monospace" font-size="20">${escapeSvg(description)}</text>
  ${swatches}
  ${ownAccent}
  <text x="100" y="535" fill="#9aa7bd" font-family="Consolas, monospace" font-size="18">ashbringer4eg.github.io/satisfactory-tools</text>
</svg>`;
};

const createShareHtml = ({ code, name, primaryHex, secondaryHex, mode }) => {
  const pageUrl = getSharePageUrl(code, mode);
  const imageUrl = getShareCardUrl(code, mode);
  const title = `${name} - ${mode === "two" ? "DUO" : "SOLO"} swatch`;
  const description = mode === "two"
    ? `Primary ${primaryHex.toUpperCase()} · Secondary ${secondaryHex.toUpperCase()}`
    : `Primary ${primaryHex.toUpperCase()}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="../../favicon.ico" />
    <link rel="canonical" href="${escapeHtml(pageUrl)}" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="theme-color" content="#f4a34f" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(title)}" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #0f1217;
        color: #e5ebf5;
        font-family: Consolas, "Courier New", monospace;
      }
      main {
        width: min(92vw, 760px);
        border: 1px solid #344054;
        background: #151922;
        padding: 20px;
      }
      img {
        width: 100%;
        display: block;
        border: 1px solid #344054;
      }
      a {
        color: #f4a34f;
      }
    </style>
  </head>
  <body>
    <main>
      <img src="../cards/${escapeHtml(code)}-${mode}.png" alt="${escapeHtml(title)}" />
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><a href="${escapeHtml(siteUrl)}/">Open Satisfactory Color Tools</a></p>
    </main>
  </body>
</html>
`;
};

const createSitemapXml = () => {
  const localizedRoutes = ["", ...appModes.map(({ id }) => id)];
  const localizedEntries = localizedRoutes.flatMap((route) => {
    const suffix = route ? `${route}/` : "";
    const englishUrl = `${siteUrl}/${suffix}`;
    const ukrainianUrl = `${siteUrl}/uk/${suffix}`;
    const alternates = `    <xhtml:link rel="alternate" hreflang="en" href="${escapeHtml(englishUrl)}" />
    <xhtml:link rel="alternate" hreflang="uk" href="${escapeHtml(ukrainianUrl)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeHtml(englishUrl)}" />`;

    return [englishUrl, ukrainianUrl].map(
      (url) => `  <url>\n    <loc>${escapeHtml(url)}</loc>\n${alternates}\n  </url>`,
    );
  });
  const changelogEntry = `  <url>\n    <loc>${escapeHtml(siteUrl)}/changelog.html</loc>\n  </url>`;
  const entries = [
    ...localizedEntries.slice(0, 2),
    changelogEntry,
    ...localizedEntries.slice(2),
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
};

export const generateShareCards = async () => {
  const raw = JSON.parse(await readFile(colorsPath, "utf-8"));
  if (!raw || !Array.isArray(raw.colors)) {
    throw new Error("Invalid colors.json: expected colors array.");
  }

  await ensureShareRoot();

  let completedColorsCount = 0;
  const totalColors = raw.colors.length;

  const tasks = raw.colors.map(async (color, index) => {
    const code = assertColorCode(color.code, index);
    const name = typeof color.defaultName === "string" && color.defaultName.trim()
      ? color.defaultName.trim()
      : code;
    const primaryHex = assertHex(color.hex, "hex", code);
    const secondaryHex = assertHex(color.secondaryColor, "secondaryColor", code);

    await mkdir(path.join(shareRoot, code), { recursive: true });

    const modeTasks = shareModes.map(async (mode) => {
      const svg = createCardSvg({ code, name, primaryHex, secondaryHex, mode });
      await sharp(Buffer.from(svg)).png().toFile(getShareCardPath(code, mode));
      await writeFile(
        getSharePagePath(code, mode),
        createShareHtml({ code, name, primaryHex, secondaryHex, mode }),
        "utf-8",
      );
    });

    await Promise.all(modeTasks);
    completedColorsCount += 1;
    console.log(`Generating HTML share page for ${name}. [${completedColorsCount}/${totalColors}]`);
  });

  await Promise.all(tasks);

  await Promise.all(appModes.map(async (mode) => {
    const svg = createModeCardSvg(mode);
    await sharp(Buffer.from(svg)).png().toFile(getModeShareCardPath(mode.id));
  }));
  await writeFile(sitemapPath, createSitemapXml(), "utf-8");

  return totalColors;
};

if (process.argv[1] === __filename) {
  generateShareCards()
    .then((count) => {
      console.log(`Generated Discord share cards for ${count} colors.`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
