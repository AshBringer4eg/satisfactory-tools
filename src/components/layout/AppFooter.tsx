import { Coffee, Github, MessageCircle } from "lucide-react";
import type { MouseEvent } from "react";
import { t } from "@/i18n";

interface AppFooterProps {
  onResetCounters: (event: MouseEvent<HTMLButtonElement>) => void;
}

const AppFooter = ({ onResetCounters }: AppFooterProps) => (
  <footer className="shrink-0 border-t border-border px-4 py-4 sm:px-6 lg:py-2">
    <div className="flex flex-col gap-3 lg:gap-1">
      <div className="grid grid-cols-1 items-baseline gap-2 lg:grid-cols-[1fr_auto] lg:gap-3">
        <div className="min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground">
            {t("footer.toolkit")}
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-start text-left font-mono text-[11px] text-muted-foreground lg:items-end lg:text-right">
          <div className="hidden items-center justify-end gap-2 whitespace-nowrap lg:flex">
            <span>{t("footer.clickToCopy")}</span>
            <span>|</span>
            <button
              type="button"
              onClick={onResetCounters}
              className="font-mono text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t("footer.resetCounters")}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 leading-tight lg:hidden">
            <span>{t("footer.clickToCopy")}</span>
            <button
              type="button"
              onClick={onResetCounters}
              className="font-mono text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t("footer.resetCounters")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0 font-mono text-[10px] text-muted-foreground">
          <div className="hidden flex-wrap items-center gap-1 leading-tight lg:flex">
            <span>{t("footer.thanksForColorData")}</span>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/154vft6/vencams_colour_list_25/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              u/Vencam
            </a>
            <span>|</span>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/1ft4tb8/i_made_a_list_of_item_colors_for_10/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              u/Squidcraft_101
            </a>
            <span>|</span>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/1fr57ze/reference_hex_values_for_various_realworld_lights/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              u/RosieQParker
            </a>
            <span>|</span>
            <a
              href="https://www.reddit.com/user/Ok_Hall4730/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              ME :)
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 leading-tight lg:hidden">
            <span className="basis-full">{t("footer.thanksForColorData")}</span>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/154vft6/vencams_colour_list_25/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              u/Vencam
            </a>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/1ft4tb8/i_made_a_list_of_item_colors_for_10/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              u/Squidcraft_101
            </a>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/1fr57ze/reference_hex_values_for_various_realworld_lights/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              u/RosieQParker
            </a>
            <a
              href="https://www.reddit.com/user/Ok_Hall4730/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              ME :)
            </a>
          </div>
        </div>

        <div className="min-w-0 font-mono text-[10px] text-muted-foreground">
          <div className="hidden items-center justify-end gap-2 whitespace-nowrap text-right leading-tight lg:flex">
            <a
              href="https://buymeacoffee.com/ashbringer4eg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm border border-primary/40 px-1.5 py-0.5 font-bold text-primary no-underline transition-colors hover:border-primary hover:bg-primary/10"
              aria-label={t("footer.supportAria")}
            >
              <Coffee className="w-3 h-3 shrink-0" aria-hidden="true" />
              {t("footer.support")}
            </a>
            <span>|</span>
            <a
              href="https://github.com/AshBringer4eg/satisfactory-tools/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
              aria-label={t("footer.feedbackGithubAria")}
            >
              <Github className="w-3 h-3 shrink-0" />
              {t("footer.feedbackGithub")}
            </a>
            <span>|</span>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/1rzqp4w/i_made_a_simple_satisfactory_color_swatch_tool"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
              aria-label={t("footer.feedbackRedditAria")}
            >
              <MessageCircle className="w-3 h-3 shrink-0" />
              {t("footer.feedbackReddit")}
            </a>
            <span>|</span>
            <a
              href={`${import.meta.env.BASE_URL}changelog.html`}
              className="underline underline-offset-2 hover:text-foreground inline-flex items-center"
              aria-label={t("footer.changelogAria")}
            >
              {t("footer.changelog")}
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-2 text-left leading-tight lg:hidden">
            <a
              href="https://buymeacoffee.com/ashbringer4eg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm border border-primary/40 px-1.5 py-0.5 font-bold text-primary no-underline transition-colors hover:border-primary hover:bg-primary/10"
              aria-label={t("footer.supportAria")}
            >
              <Coffee className="h-3 w-3" aria-hidden="true" />
              {t("footer.support")}
            </a>
            <a
              href="https://github.com/AshBringer4eg/satisfactory-tools/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
              aria-label={t("footer.feedbackGithubAria")}
            >
              <Github className="h-3 w-3" />
              {t("footer.feedbackGithub")}
            </a>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/1rzqp4w/i_made_a_simple_satisfactory_color_swatch_tool"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
              aria-label={t("footer.feedbackRedditAria")}
            >
              <MessageCircle className="h-3 w-3" />
              {t("footer.feedbackReddit")}
            </a>
            <a
              href={`${import.meta.env.BASE_URL}changelog.html`}
              className="underline underline-offset-2 hover:text-foreground"
              aria-label={t("footer.changelogAria")}
            >
              {t("footer.changelog")}
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default AppFooter;
