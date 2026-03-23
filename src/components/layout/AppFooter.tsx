import { Github, MessageCircle } from "lucide-react";
import type { MouseEvent } from "react";
import { t } from "@/i18n";

interface AppFooterProps {
  onResetCounters: (event: MouseEvent<HTMLButtonElement>) => void;
}

const AppFooter = ({ onResetCounters }: AppFooterProps) => (
  <footer className="border-t border-border px-6 py-2 shrink-0">
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[1fr_auto] items-baseline gap-3">
        <div className="min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground">
            {t("footer.toolkit")}
          </span>
        </div>
        <div className="min-w-0 flex flex-col items-end text-right font-mono text-[11px] text-muted-foreground">
          <div className="hidden md:flex items-center justify-end gap-2 whitespace-nowrap">
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
          <div className="md:hidden flex flex-col items-end leading-tight">
            <span>{t("footer.clickToCopy")} |</span>
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

      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="min-w-0 font-mono text-[10px] text-muted-foreground">
          <div className="hidden md:flex flex-wrap items-center gap-1 leading-tight">
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
              href="https://www.reddit.com/user/Ok_Hall4730/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              ME :)
            </a>
          </div>
          <div className="md:hidden flex flex-col leading-tight">
            <span>{t("footer.thanksForColorData")}</span>
            <span>
              <a
                href="https://www.reddit.com/r/SatisfactoryGame/comments/154vft6/vencams_colour_list_25/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                u/Vencam
              </a>
              {" |"}
            </span>
            <span>
              <a
                href="https://www.reddit.com/r/SatisfactoryGame/comments/1ft4tb8/i_made_a_list_of_item_colors_for_10/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                u/Squidcraft_101
              </a>
              {" |"}
            </span>
            <span>
              <a
                href="https://www.reddit.com/user/Ok_Hall4730/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                ME :)
              </a>
            </span>
          </div>
        </div>

        <div className="min-w-0 font-mono text-[10px] text-muted-foreground">
          <div className="hidden md:flex items-center justify-end gap-2 text-right whitespace-nowrap leading-tight">
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
          <div className="md:hidden flex flex-col items-end text-right leading-tight">
            <span>
              <a
                href="https://github.com/AshBringer4eg/satisfactory-tools/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
                aria-label={t("footer.feedbackGithubAria")}
              >
                <Github className="w-3 h-3" />
                {t("footer.feedbackGithub")}
              </a>
              {" |"}
            </span>
            <span>
              <a
                href="https://www.reddit.com/r/SatisfactoryGame/comments/1rzqp4w/i_made_a_simple_satisfactory_color_swatch_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
                aria-label={t("footer.feedbackRedditAria")}
              >
                <MessageCircle className="w-3 h-3" />
                {t("footer.feedbackReddit")}
              </a>
              {" |"}
            </span>
            <span>
              <a
                href={`${import.meta.env.BASE_URL}changelog.html`}
                className="underline underline-offset-2 hover:text-foreground"
                aria-label={t("footer.changelogAria")}
              >
                {t("footer.changelog")}
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default AppFooter;
