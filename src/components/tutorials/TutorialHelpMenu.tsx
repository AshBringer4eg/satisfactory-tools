import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { t } from "@/i18n";
import { TUTORIAL_IDS } from "@/tutorials/catalog";
import { useTutorial } from "@/tutorials/tutorial-context";
import type { TutorialId } from "@/tutorials/types";

const TutorialHelpMenu = () => {
  const [open, setOpen] = useState(false);
  const { startTutorial } = useTutorial();

  const handleStart = (id: TutorialId) => {
    setOpen(false);
    startTutorial(id);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={t("tutorials.openAria")}
          className="h-8 px-2"
          data-tutorial="tutorial-help"
          data-testid="tutorial-help-trigger"
        >
          <HelpCircle aria-hidden="true" />
          <span className="hidden sm:inline">{t("tutorials.help")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(92vw,384px)] overflow-y-auto sm:max-w-[384px]"
        data-testid="tutorial-help-content"
      >
        <SheetHeader>
          <SheetTitle>{t("tutorials.menuTitle")}</SheetTitle>
          <SheetDescription>{t("tutorials.menuDescription")}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid gap-2 font-mono text-[12px]">
          {TUTORIAL_IDS.map((id) => (
            <Button
              key={id}
              type="button"
              variant="outline"
              className="h-auto min-h-10 justify-start text-left uppercase"
              onClick={() => handleStart(id)}
              data-testid={`tutorial-help-${id}`}
            >
              {t(`tutorials.items.${id}.title`)}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TutorialHelpMenu;
