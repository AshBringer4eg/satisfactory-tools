import { Terminal } from "lucide-react";
import { setLocale, t } from "@/i18n";

const AppHeader = () => {
  const languageOptions = ["EN"] as const;
  const activeLanguage = "EN";

  return (
    <header className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Terminal className="w-5 h-5 text-primary" />
        <h1 className="font-mono text-[12px] font-bold uppercase tracking-wider text-foreground">
          {t("header.title")}
        </h1>
        <span className="font-mono text-[11px] text-muted-foreground">
          {`// VER ${__APP_VERSION__}`}
        </span>
      </div>
      <nav aria-label="Language switcher" className="font-mono text-[11px] uppercase tracking-wider">
        {languageOptions.map((language, index) => (
          <span key={language}>
            {index > 0 && <span className="mx-1 text-muted-foreground">|</span>}
            <button
              type="button"
              onClick={() => setLocale(language.toLowerCase())}
              className={`underline underline-offset-2 transition-colors ${
                activeLanguage === language
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language}
            </button>
          </span>
        ))}
      </nav>
    </header>
  );
};

export default AppHeader;
