import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Search,
  SwatchBook,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { t } from "@/i18n";

export type TutorialPreviewId =
  | "swatches"
  | "filtering"
  | "harmony"
  | "accessibility";

type TutorialPreview = {
  id: TutorialPreviewId;
  mode: "solo" | "duo";
  icon: LucideIcon;
};

const tutorialPreviews: TutorialPreview[] = [
  { id: "swatches", mode: "duo", icon: SwatchBook },
  { id: "filtering", mode: "duo", icon: Search },
  { id: "harmony", mode: "duo", icon: WandSparkles },
  { id: "accessibility", mode: "duo", icon: Eye },
];

const tutorialImagePath = (id: TutorialPreviewId): string =>
  `${import.meta.env.BASE_URL}tutorials/${id}.webp`;

interface TutorialPreviewCarouselProps {
  localePrefix: string;
}

const TutorialPreviewCarousel = ({
  localePrefix,
}: TutorialPreviewCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const updateSelectedIndex = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateSelectedIndex();
    emblaApi.on("select", updateSelectedIndex);
    emblaApi.on("reInit", updateSelectedIndex);

    return () => {
      emblaApi.off("select", updateSelectedIndex);
      emblaApi.off("reInit", updateSelectedIndex);
    };
  }, [emblaApi, updateSelectedIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!emblaApi) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      emblaApi.scrollPrev();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      emblaApi.scrollNext();
    }
  };

  return (
    <section className="border-b border-border bg-card/30 px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {t("landing.tutorials.eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase text-foreground">
              {t("landing.tutorials.title")}
            </h2>
          </div>

          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label={t("landing.tutorials.previous")}
              className="inline-flex size-16 items-center justify-center border border-border bg-background text-primary transition-colors hover:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="tutorial-carousel-previous"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label={t("landing.tutorials.next")}
              className="inline-flex size-16 items-center justify-center border border-border bg-background text-primary transition-colors hover:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="tutorial-carousel-next"
            >
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="mt-6 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
          ref={emblaRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={t("landing.tutorials.carouselAria")}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          data-testid="landing-tutorial-carousel"
        >
          <div className="flex touch-pan-y">
            {tutorialPreviews.map(({ id, icon: Icon, mode }, index) => {
              const isSelected = selectedIndex === index;
              const itemKey = `landing.tutorials.items.${id}`;
              const tutorialPath = `${localePrefix}/${mode}/?tutorial=${id}`;

              return (
                <article
                  key={id}
                  className="min-w-0 flex-[0_0_100%] px-px"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={t("landing.tutorials.slideAria", {
                    index: index + 1,
                    total: tutorialPreviews.length,
                    title: t(`${itemKey}.title`),
                  })}
                  data-testid={`tutorial-preview-${id}`}
                  data-selected={isSelected}
                >
                  <div className="grid overflow-hidden border border-border bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.22)] lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                    <div className="relative border-b border-border bg-[#0d1118] lg:border-b-0 lg:border-r">
                      <img
                        src={tutorialImagePath(id)}
                        width={1200}
                        height={675}
                        loading={index === 0 ? "eager" : "lazy"}
                        alt={t(`${itemKey}.imageAlt`)}
                        className="block aspect-video h-full w-full object-cover"
                      />
                      <span className="absolute left-4 top-4 border border-primary/50 bg-background/90 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-primary backdrop-blur">
                        {t(`${itemKey}.label`)}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-col p-5 sm:p-7">
                      <div className="flex items-center gap-3 text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                        <span className="font-mono text-xs font-black uppercase tracking-wider">
                          {t(`${itemKey}.label`)}
                        </span>
                      </div>
                      <h3 className="mt-5 text-xl font-black uppercase leading-tight text-foreground">
                        {t(`${itemKey}.title`)}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t(`${itemKey}.description`)}
                      </p>
                      <div className="mt-6 border-l-2 border-primary/70 pl-4">
                        <p className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          {t("landing.tutorials.featuresLabel")}
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-foreground">
                          {[1, 2, 3].map((feature) => (
                            <li key={feature} className="flex gap-2">
                              <span className="font-mono text-primary" aria-hidden="true">
                                &gt;
                              </span>
                              {t(`${itemKey}.feature${feature}`)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <NavLink
                        to={tutorialPath}
                        tabIndex={isSelected ? 0 : -1}
                        className="mt-8 inline-flex items-center gap-2 self-start border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                        data-testid={`tutorial-start-${id}`}
                      >
                        {t("landing.tutorials.start")}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </NavLink>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-2" aria-label={t("landing.tutorials.paginationAria")}>
          {tutorialPreviews.map(({ id }, index) => {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={id}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={t("landing.tutorials.goTo", { index: index + 1 })}
                aria-current={isSelected ? "true" : undefined}
                className={`h-2.5 w-8 border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-border bg-background hover:border-primary/60"
                }`}
                data-testid={`tutorial-carousel-dot-${id}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TutorialPreviewCarousel;
