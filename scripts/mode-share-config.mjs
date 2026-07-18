export const siteUrl = (
  process.env.SHARE_SITE_URL ??
  "https://satisfactory-tools.vercel.app"
).replace(/\/+$/, "");

export const appModes = [
  {
    id: "solo",
    title: "Satisfactory Item HEX Color Codes",
    description: "Browse and copy individual Satisfactory item HEX color codes with searchable swatches, category filters, and accessibility previews.",
    schemaName: "Satisfactory Item HEX Color Codes",
    schemaDescription: "Browse and copy individual Satisfactory item HEX color codes with searchable swatches, category filters, and accessibility previews.",
    ukTitle: "HEX-коди кольорів предметів Satisfactory",
    ukDescription: "Переглядайте й копіюйте HEX-коди кольорів предметів Satisfactory за допомогою пошуку, фільтрів категорій і попереднього перегляду доступності.",
  },
  {
    id: "duo",
    title: "Satisfactory Primary & Secondary Color Codes",
    description: "Browse Satisfactory primary and secondary color pairs, preview two-tone swatches, and copy both HEX color codes.",
    schemaName: "Satisfactory Primary & Secondary Color Codes",
    schemaDescription: "Browse Satisfactory primary and secondary color pairs, preview two-tone swatches, and copy both HEX color codes.",
    ukTitle: "Основні та додаткові коди кольорів Satisfactory",
    ukDescription: "Переглядайте пари основних і додаткових кольорів Satisfactory, двоколірні зразки та копіюйте обидва HEX-коди.",
  },
  {
    id: "own",
    title: "Satisfactory Custom Color Palette Generator",
    description: "Build custom Satisfactory color palettes, generate OKLCH harmonies, and test combinations for color-vision accessibility.",
    schemaName: "Satisfactory Custom Color Palette Generator",
    schemaDescription: "Build custom Satisfactory color palettes, generate OKLCH harmonies, and test combinations for color-vision accessibility.",
    ukTitle: "Генератор власних палітр кольорів Satisfactory",
    ukDescription: "Створюйте власні палітри кольорів Satisfactory, генеруйте гармонії OKLCH і перевіряйте комбінації на доступність для різних типів колірного зору.",
  },
];
