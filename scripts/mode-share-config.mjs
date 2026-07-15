export const siteUrl = (
  process.env.SHARE_SITE_URL ??
  "https://ashbringer4eg.github.io/satisfactory-tools"
).replace(/\/+$/, "");

export const appModes = [
  {
    id: "solo",
    title: "SOLO Color Mode",
    description: "Search and copy individual Satisfactory item HEX color codes.",
  },
  {
    id: "duo",
    title: "DUO Color Mode",
    description: "Preview and copy Satisfactory primary and secondary color pairs.",
  },
  {
    id: "own",
    title: "OWN Palette Mode",
    description: "Build custom Satisfactory palettes and generate accessible color harmonies.",
  },
];
