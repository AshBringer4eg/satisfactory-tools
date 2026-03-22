import { Github, MessageCircle } from "lucide-react";
import type { MouseEvent } from "react";

interface AppFooterProps {
  onResetCounters: (event: MouseEvent<HTMLButtonElement>) => void;
}

const AppFooter = ({ onResetCounters }: AppFooterProps) => (
  <footer className="border-t border-border px-6 py-2 shrink-0">
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[1fr_auto] items-baseline gap-3">
        <div className="min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground">
            FICSIT_EMPLOYEE_TOOLKIT
          </span>
        </div>
        <div className="min-w-0 flex flex-col items-end text-right font-mono text-[11px] text-muted-foreground">
          <div className="hidden md:flex items-center justify-end gap-2 whitespace-nowrap">
            <span>CLICK_SWATCH_TO_COPY_HEX</span>
            <span>|</span>
            <button
              type="button"
              onClick={onResetCounters}
              className="font-mono text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              RESET_COUNTERS
            </button>
          </div>
          <div className="md:hidden flex flex-col items-end leading-tight">
            <span>CLICK_SWATCH_TO_COPY_HEX |</span>
            <button
              type="button"
              onClick={onResetCounters}
              className="font-mono text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              RESET_COUNTERS
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="min-w-0 font-mono text-[10px] text-muted-foreground">
          <div className="hidden md:flex flex-wrap items-center gap-1 leading-tight">
            <span>THANKS_FOR_COLOR_DATA:</span>
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
            <span>THANKS_FOR_COLOR_DATA:</span>
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
          <div className="hidden md:flex items-baseline justify-end gap-2 text-right whitespace-nowrap leading-tight">
            <a
              href="https://github.com/AshBringer4eg/satisfactory-tools/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
              aria-label="Open GitHub Issues feedback page"
            >
              <Github className="w-3 h-3 align-text-bottom" />
              FEEDBACK_GH
            </a>
            <span>|</span>
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/1rzqp4w/i_made_a_simple_satisfactory_color_swatch_tool"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
              aria-label="Open Reddit post feedback thread"
            >
              <MessageCircle className="w-3 h-3 align-text-bottom" />
              FEEDBACK_REDDIT
            </a>
          </div>
          <div className="md:hidden flex flex-col items-end text-right leading-tight">
            <span>
              <a
                href="https://github.com/AshBringer4eg/satisfactory-tools/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
                aria-label="Open GitHub Issues feedback page"
              >
                <Github className="w-3 h-3" />
                FEEDBACK_GH
              </a>
              {" |"}
            </span>
            <span>
              <a
                href="https://www.reddit.com/r/SatisfactoryGame/comments/1rzqp4w/i_made_a_simple_satisfactory_color_swatch_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
                aria-label="Open Reddit post feedback thread"
              >
                <MessageCircle className="w-3 h-3" />
                FEEDBACK_REDDIT
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default AppFooter;
