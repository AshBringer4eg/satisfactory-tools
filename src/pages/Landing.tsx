import { useEffect, type MouseEvent } from "react";
import {
  ArrowRight,
  Copy,
  MousePointer2,
  Palette,
  Search,
  ShieldCheck,
  SwatchBook,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { ColorAccessibilityProvider } from "@/components/accessibility/ColorAccessibilityProvider";
import SwatchAssistOverlay from "@/components/accessibility/SwatchAssistOverlay";
import TutorialPreviewCarousel from "@/components/landing/TutorialPreviewCarousel";
import AppFooter from "@/components/layout/AppFooter";
import AppHeader from "@/components/layout/AppHeader";
import { ALL_COPY_COUNT_STORAGE_KEYS, RESET_COPY_COUNTS_EVENT } from "@/config/storage";
import {
  colorPalettes,
  type ColorCode,
  type SatisfactoryColor,
} from "@/data/colors";
import { setLocale, t, useLocale } from "@/i18n";
import {
  getSwatchOverlayToken,
  simulateHexColor,
} from "@/lib/color-accessibility";

const featuredColorCodes: ColorCode[] = [
  "COLOR_REINFORCED_IRON_PLATE",
  "COLOR_CATERIUM_INGOT",
  "COLOR_COMPUTER",
  "COLOR_TURBOFUEL",
  "COLOR_ALCLAD_ALUMINUM_SHEET",
  "COLOR_NUCLEAR_PASTA",
];

const toolCards = [
  { id: "solo", icon: Palette, colors: ["#FFEF63"] },
  { id: "duo", icon: SwatchBook, colors: ["#FFD6AA", "#B8FFCA"] },
  { id: "own", icon: ShieldCheck, colors: ["#1A7F7A", "#FA0C2B"] },
] as const;

const howStepIcons = [MousePointer2, Search, Copy] as const;

type ToolCard = (typeof toolCards)[number];

const ToolSpecimen = ({ card }: { card: ToolCard }) => {
  const { id, colors } = card;

  return (
    <div
      className="flex min-h-[156px] w-[144px] shrink-0 flex-col items-center justify-center self-center justify-self-center"
      aria-hidden="true"
    >
      <p className="h-4 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {t(`landing.tools.preview.${id}`)}
      </p>
      <div className="mt-1 flex items-start justify-center gap-2">
        {colors.map((hex, index) => (
          <div key={hex} className="grid grid-rows-[16px_56px_20px] justify-items-center">
            <p
              className="text-center font-mono text-[8px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {t(
                `landing.tools.preview.${
                  index === 0 ? "primary" : "secondary"
                }`,
              )}
            </p>
            <div
              className="h-14 w-14 rounded-[2px] border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_8px_rgba(0,0,0,0.3)]"
              style={{ backgroundColor: hex }}
            />
            <code className="self-end text-center font-mono text-[9px] font-bold text-muted-foreground">
              {hex}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
};

const LandingDuoSwatch = ({ color }: { color: SatisfactoryColor }) => (
  <article
    aria-label={`${color.name}: ${color.hex.toUpperCase()}, ${color.secondaryColor.toUpperCase()}`}
    className="relative aspect-[5/3] w-full overflow-hidden rounded-[2px] border border-white/[0.03] bg-card text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3)] transition-colors hover:border-primary/35"
  >
    <div className="absolute inset-0 flex" aria-hidden="true">
      <div
        className="relative basis-[70%] overflow-hidden"
        style={{ backgroundColor: color.hex }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <code className="absolute bottom-[0.2rem] left-3 z-10 font-mono text-[13px] tracking-normal text-white">
          {color.hex.toUpperCase()}
        </code>
      </div>
      <div
        className="relative basis-[30%] overflow-hidden"
        style={{ backgroundColor: color.secondaryColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <code className="absolute inset-x-0 bottom-[0.2rem] z-10 truncate px-1 text-center font-mono text-[11px] tracking-tight text-white">
          {color.secondaryColor.toUpperCase()}
        </code>
      </div>
      <span className="absolute bottom-[1.6rem] left-3 right-3 z-10 block truncate text-[14px] font-semibold leading-tight text-white">
        {color.name}
      </span>
      <span className="absolute right-2 top-2 z-10 rounded-[2px] bg-black/35 px-2 py-0.5 text-[12px] font-semibold text-white">
        0x
      </span>
    </div>
  </article>
);

const accessibilityPreviewHex = "#D4292E";
const accessibilityCueColors = ["#1A7F7A", "#FA0C2B"] as const;
const accessibilityHarmonyColors = ["#CB603A", "#3A8ECB", "#86CB3A"] as const;

const AccessibilityExamples = () => (
  <div className="mt-6 grid gap-3 md:grid-cols-3">
    <article className="border border-border bg-background/70 p-4 transition-colors hover:border-primary/35">
      <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
        01 // {t("landing.accessibility.examples.vision.title")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2" aria-hidden="true">
        {(["normal", "deutan"] as const).map((mode) => (
          <div key={mode}>
            <div
              className="h-16 rounded-[2px] border border-border"
              style={{ backgroundColor: simulateHexColor(accessibilityPreviewHex, mode) }}
            />
            <p className="mt-1 text-center font-mono text-[9px] font-bold uppercase text-muted-foreground">
              {t(`landing.accessibility.examples.vision.${mode}`)}
            </p>
          </div>
        ))}
      </div>
      <h3 className="mt-4 text-sm font-black uppercase text-foreground">
        {t("landing.accessibility.examples.vision.heading")}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {t("landing.accessibility.examples.vision.description")}
      </p>
    </article>

    <article className="border border-border bg-background/70 p-4 transition-colors hover:border-primary/35">
      <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
        02 // {t("landing.accessibility.examples.cues.title")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2" aria-hidden="true">
        {accessibilityCueColors.map((hex, index) => (
          <div
            key={hex}
            className="relative h-[84px] overflow-hidden rounded-[2px] border border-border"
            style={{ backgroundColor: hex }}
          >
            <SwatchAssistOverlay
              token={getSwatchOverlayToken(`landing-cue-${index}`, "primary")}
              showPattern
              showSymbol
              presentation="compact"
            />
            <code className="absolute bottom-1.5 left-2 z-10 font-mono text-[9px] font-bold text-white">
              {hex}
            </code>
          </div>
        ))}
      </div>
      <h3 className="mt-4 text-sm font-black uppercase text-foreground">
        {t("landing.accessibility.examples.cues.heading")}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {t("landing.accessibility.examples.cues.description")}
      </p>
    </article>

    <article className="border border-border bg-background/70 p-4 transition-colors hover:border-primary/35">
      <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
        03 // {t("landing.accessibility.examples.harmony.title")}
      </p>
      <div className="mt-4 flex h-[84px] overflow-hidden rounded-[2px] border border-border" aria-hidden="true">
        {accessibilityHarmonyColors.map((hex) => (
          <div
            key={hex}
            className="relative flex-1"
            style={{ backgroundColor: hex }}
          >
            <code className="absolute inset-x-0 bottom-1.5 truncate px-1 text-center font-mono text-[8px] font-bold text-white">
              {hex}
            </code>
          </div>
        ))}
      </div>
      <h3 className="mt-4 text-sm font-black uppercase text-foreground">
        {t("landing.accessibility.examples.harmony.heading")}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {t("landing.accessibility.examples.harmony.description")}
      </p>
    </article>
  </div>
);

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

              <div
                className="relative min-h-[400px] sm:min-h-[420px]"
                aria-label={t("landing.hero.samplesAria")}
              >
                {featuredColors.slice(0, 3).map((color, index) => (
                  <div
                    key={color.code}
                    className="absolute left-1/2 w-[min(100%,390px)]"
                    style={{
                      top: `${index * 86}px`,
                      transform: `translateX(calc(-50% + ${(index - 1) * 18}px)) rotate(${(index - 1) * 1.5}deg)`,
                      zIndex: 3 - index,
                    }}
                  >
                    <LandingDuoSwatch color={color} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <TutorialPreviewCarousel localePrefix={localePrefix} />

          <section className="border-b border-border px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {t("landing.tools.eyebrow")}
              </p>
              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                {toolCards.map((card, index) => {
                  const { id, icon: Icon } = card;
                  return (
                  <article
                    key={id}
                    className="group relative h-full overflow-hidden rounded-[3px] border border-border bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.28)] transition-colors hover:border-primary/35"
                  >
                    <div className="flex h-full flex-col p-5">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <span className="font-mono text-xs font-black uppercase tracking-wider text-primary">
                          0{index + 1} // {id}
                        </span>
                        <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                      </div>
                      <div className="mt-5 grid flex-1 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_144px] lg:grid-cols-[minmax(0,1fr)_144px]">
                        <div className="flex min-w-0 flex-col">
                          <h2 className="text-lg font-black uppercase leading-tight text-foreground">
                            {t(`landing.tools.${id}.title`)}
                          </h2>
                          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                            {t(`landing.tools.${id}.description`)}
                          </p>
                          <NavLink
                            to={modePath(id)}
                            className="mt-6 inline-flex items-center gap-2 self-start font-mono text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:text-foreground"
                          >
                            {t(`landing.tools.${id}.action`)}
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </NavLink>
                        </div>
                        <ToolSpecimen card={card} />
                      </div>
                    </div>
                  </article>
                  );
                })}
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
                  <article key={color.code} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border border-border bg-card p-3 transition-colors hover:border-primary/35">
                    <span className="size-12 border border-border" style={{ backgroundColor: color.hex }} aria-hidden="true" />
                    <span className="min-w-0 truncate text-sm font-bold text-foreground">{color.name}</span>
                    <code className="font-mono text-xs font-bold uppercase text-primary">{color.hex.toUpperCase()}</code>
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
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((step) => {
                  const StepIcon = howStepIcons[step - 1];
                  return (
                  <article key={step} className="group border border-border bg-background p-6 transition-colors hover:border-primary/35">
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-mono text-2xl font-black text-primary">0{step}</span>
                      <StepIcon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-sm font-black uppercase text-foreground">{t(`landing.how.step${step}.title`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`landing.how.step${step}.description`)}</p>
                  </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="border-b border-border px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <article className="border border-primary/50 bg-primary/5 p-6 transition-colors hover:border-primary sm:p-8">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">{t("landing.accessibility.eyebrow")}</p>
                <div className="mt-4">
                  <h2 className="text-2xl font-black uppercase text-foreground">{t("landing.accessibility.title")}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("landing.accessibility.description")}</p>
                </div>
                <AccessibilityExamples />
              </article>
            </div>
          </section>

          <section className="px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 grid gap-3 sm:grid-cols-3">
                {(["registration", "paid", "tracking"] as const).map((item, index) => (
                  <article
                    key={item}
                    className="group border border-border bg-card p-5 transition-colors hover:border-primary/35"
                  >
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
                      0{index + 1} // NO
                    </span>
                    <h2 className="mt-3 text-sm font-black uppercase text-foreground">
                      {t(`landing.noParadigm.${item}.title`)}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {t(`landing.noParadigm.${item}.description`)}
                    </p>
                  </article>
                ))}
              </div>
              <h2 className="font-mono text-sm font-black uppercase tracking-[0.15em] text-foreground">{t("landing.faq.title")}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <article key={item} className="border border-border border-l-2 border-l-primary/60 bg-card p-5 transition-colors hover:border-primary/35 hover:border-l-primary">
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
