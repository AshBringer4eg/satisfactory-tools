import { Terminal } from "lucide-react";
import AccessibilityPaletteMenu from "@/components/accessibility/AccessibilityPaletteMenu";
import { setLocale, t, useLocale } from "@/i18n";

const AppHeader = () => {
  const activeLocale = useLocale();
  const languageOptions = [
    { label: "EN", value: "en" },
    { label: "UA", value: "uk" },
  ] as const;

  return (
    <header className="border-b border-border px-6 py-3 flex items-center justify-between gap-3 shrink-0">
      <div className="flex min-w-0 items-center gap-3">
        <Terminal className="w-5 h-5 text-primary" />
        <h1 className="truncate font-mono text-[12px] font-bold uppercase tracking-wider text-foreground">
          <span className="sr-only">Satisfactory Color Codes and Palette Tool</span>
          <span aria-hidden="true">{t("header.title")}</span>
        </h1>
        <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">
          {`// VER ${__APP_VERSION__}`}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <AccessibilityPaletteMenu />
        <nav aria-label="Language switcher" className="font-mono text-[11px] uppercase tracking-wider">
          {languageOptions.map((language, index) => (
            <span key={language.value}>
              {index > 0 && <span className="mx-1 text-muted-foreground">|</span>}
              <button
                type="button"
                onClick={() => setLocale(language.value)}
                aria-pressed={activeLocale === language.value}
                aria-label={`Switch language to ${language.label}`}
                data-testid={`language-${language.value}`}
                className={`underline underline-offset-2 transition-colors ${
                  activeLocale === language.value
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {language.label}
              </button>
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
