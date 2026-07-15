import { useEffect, type MouseEvent } from "react";
import { ArrowRight, Palette, ShieldCheck, SwatchBook } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ColorAccessibilityProvider } from "@/components/accessibility/ColorAccessibilityProvider";
import AppFooter from "@/components/layout/AppFooter";
import AppHeader from "@/components/layout/AppHeader";
import { ALL_COPY_COUNT_STORAGE_KEYS, RESET_COPY_COUNTS_EVENT } from "@/config/storage";
import { colorPalettes, type ColorCode } from "@/data/colors";
import { setLocale, t, useLocale } from "@/i18n";

const featuredColorCodes: ColorCode[] = [
  "COLOR_REINFORCED_IRON_PLATE",
  "COLOR_CATERIUM_INGOT",
  "COLOR_COMPUTER",
  "COLOR_TURBOFUEL",
  "COLOR_ALCLAD_ALUMINUM_SHEET",
  "COLOR_NUCLEAR_PASTA",
];

const toolCards = [
  { id: "solo", icon: Palette },
  { id: "duo", icon: SwatchBook },
  { id: "own", icon: ShieldCheck },
] as const;

const Landing = ({ initialLocale = "en" }: { initialLocale?: "en" | "uk" }) => {
  const activeLocale = useLocale();
  const localePrefix = activeLocale === "uk" ? "/uk" : "";
  const paletteColors = colorPalettes.default.colors;
  const featuredColors = featuredColorCodes.flatMap((code) => {
    const color = paletteColors.find((candidate) => candidate.code === code);
    return color ? [color] : [];
  });

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const handleResetCounters = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    for (const storageKey of ALL_COPY_COUNT_STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage failures.
      }
    }
    window.dispatchEvent(new Event(RESET_COPY_COUNTS_EVENT));
  };

  const modePath = (mode: "solo" | "duo" | "own") =>
    `${localePrefix}/${mode}/`;

  return (
    <ColorAccessibilityProvider>
      <div className="min-h-screen min-w-[220px] bg-background flex flex-col" data-locale={activeLocale}>
        <AppHeader />
        <main className="flex-1 overflow-hidden" data-route-scroll-container>
          <section className="border-b border-border px-6 py-12 lg:px-12 lg:py-16">
            <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div>
                <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  {t("landing.hero.status")}
                </p>
                <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl lg:text-7xl">
                  {t("landing.hero.title")}
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {t("landing.hero.description")}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {(["duo", "solo", "own"] as const).map((mode, index) => (
                    <NavLink
                      key={mode}
                      to={modePath(mode)}
                      className={`inline-flex items-center justify-center gap-2 border px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                        index === 0
                          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      {t(`landing.hero.actions.${mode}`)}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[300px]" aria-label={t("landing.hero.samplesAria")}>
                {featuredColors.slice(0, 3).map((color, index) => (
                  <article
                    key={color.code}
                    className="absolute left-1/2 w-[min(100%,390px)] border border-border bg-card p-4 shadow-2xl"
                    style={{
                      top: `${index * 88}px`,
                      transform: `translateX(calc(-50% + ${(index - 1) * 18}px)) rotate(${(index - 1) * 1.5}deg)`,
                      zIndex: 3 - index,
                    }}
                  >
                    <p className="truncate font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                      {color.name}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[color.hex, color.secondaryColor].map((hex, hexIndex) => (
                        <div key={`${color.code}-${hexIndex}`} className="overflow-hidden border border-border">
                          <div className="h-12" style={{ backgroundColor: hex }} />
                          <p className="bg-background px-2 py-1 font-mono text-[11px] font-bold uppercase text-muted-foreground">
                            {hex}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-border px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {t("landing.tools.eyebrow")}
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {toolCards.map(({ id, icon: Icon }, index) => (
                  <article key={id} className="flex flex-col border border-border bg-card p-6 shadow-[var(--shadow-inset)]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">0{index + 1} // {id.toUpperCase()}</span>
                      <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <h2 className="mt-8 text-xl font-black uppercase leading-tight text-foreground">
                      {t(`landing.tools.${id}.title`)}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {t(`landing.tools.${id}.description`)}
                    </p>
                    <NavLink
                      to={modePath(id)}
                      className="mt-8 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary hover:text-foreground"
                    >
                      {t(`landing.tools.${id}.action`)}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </NavLink>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-border px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    {t("landing.featured.eyebrow")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase text-foreground">
                    {t("landing.featured.title")}
                  </h2>
                </div>
                <NavLink to={modePath("solo")} className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-primary hover:text-foreground">
                  {t("landing.featured.action")}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </NavLink>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredColors.map((color) => (
                  <article key={color.code} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border border-border bg-card p-3">
                    <span className="size-12 border border-border" style={{ backgroundColor: color.hex }} aria-hidden="true" />
                    <span className="min-w-0 truncate text-sm font-bold text-foreground">{color.name}</span>
                    <code className="font-mono text-xs font-bold uppercase text-primary">{color.hex}</code>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-border px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-mono text-sm font-black uppercase tracking-[0.15em] text-foreground">
                {t("landing.how.title")}
              </h2>
              <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-3">
                {[1, 2, 3].map((step) => (
                  <article key={step} className="bg-background p-6">
                    <span className="font-mono text-2xl font-black text-primary">0{step}</span>
                    <h3 className="mt-5 text-sm font-black uppercase text-foreground">{t(`landing.how.step${step}.title`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`landing.how.step${step}.description`)}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-border px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-7xl border border-primary/50 bg-primary/5 p-6 sm:p-8">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("landing.accessibility.eyebrow")}</p>
              <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div>
                  <h2 className="text-2xl font-black uppercase text-foreground">{t("landing.accessibility.title")}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("landing.accessibility.description")}</p>
                </div>
                <NavLink to={modePath("own")} className="inline-flex shrink-0 items-center justify-center gap-2 border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase text-primary-foreground hover:bg-primary/90">
                  {t("landing.accessibility.action")}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </NavLink>
              </div>
            </div>
          </section>

          <section className="px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-mono text-sm font-black uppercase tracking-[0.15em] text-foreground">{t("landing.faq.title")}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <article key={item} className="border-l-2 border-primary/60 bg-card p-5">
                    <h3 className="text-sm font-black text-foreground">{t(`landing.faq.item${item}.question`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`landing.faq.item${item}.answer`)}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>
        <AppFooter onResetCounters={handleResetCounters} />
      </div>
    </ColorAccessibilityProvider>
  );
};

export default Landing;
