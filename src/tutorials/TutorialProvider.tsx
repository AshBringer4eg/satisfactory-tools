import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useJoyride, EVENTS, STATUS, type EventData } from "react-joyride";
import { useLocation, useNavigate } from "react-router-dom";
import { ClipboardPaste } from "lucide-react";
import { useColorAccessibility } from "@/components/accessibility/color-accessibility-context";
import { t, useLocale } from "@/i18n";
import { tutorialActionMatches } from "./actions";
import { findTutorialTarget, getTutorialDefinition } from "./catalog";
import {
  getTutorialIdFromSearch,
  getTutorialPath,
  getTutorialUrl,
  removeTutorialQuery,
} from "./routing";
import type {
  JoyrideTutorialStep,
  TutorialAction,
  TutorialId,
} from "./types";
import { TutorialContext, useTutorial } from "./tutorial-context";
import type { TutorialContextValue } from "./tutorial-context";

type TutorialFilteringResetter = () => void;

const AccessibilityResetTutorialContent = ({
  description,
}: {
  description: ReactNode;
}) => {
  const { resetSettings } = useColorAccessibility();
  const { reportTutorialAction } = useTutorial();

  return (
    <div className="flex flex-col gap-3">
      <div>{description}</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="tutorial-reset-accessibility"
          onClick={resetSettings}
          className="rounded-[2px] border border-border bg-transparent px-2 py-1.5 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary"
        >
          {t("tutorials.items.accessibility.steps.reset.button")}
        </button>
        <button
          type="button"
          data-testid="tutorial-apply-accessibility"
          onClick={() => reportTutorialAction({ type: "apply-accessibility" })}
          className="rounded-[2px] border border-primary bg-primary/10 px-2 py-1.5 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20"
        >
          {t("tutorials.items.accessibility.steps.reset.apply")}
        </button>
      </div>
    </div>
  );
};

const PasteTutorialContent = ({
  description,
}: {
  description: ReactNode;
}) => {
  const { reportTutorialAction } = useTutorial();
  const [value, setValue] = useState("");
  const [pasteFailed, setPasteFailed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const acceptValue = useCallback(
    (nextValue: string) => {
      setValue(nextValue);
      setPasteFailed(false);
      if (nextValue.trim()) {
        setIsReady(true);
      }
    },
    [],
  );

  const handleClipboardPaste = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      setPasteFailed(true);
      return;
    }

    try {
      const nextValue = await navigator.clipboard.readText();
      if (!nextValue.trim()) {
        setPasteFailed(true);
        return;
      }
      acceptValue(nextValue);
    } catch {
      setPasteFailed(true);
    }
  }, [acceptValue]);

  return (
    <div className="flex flex-col gap-3">
      <div>{description}</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => acceptValue(event.target.value)}
          aria-label={t("tutorials.pasteInputAria")}
          data-testid="tutorial-paste-input"
          className="min-w-0 flex-1 rounded-[2px] border border-border bg-background px-2 py-1.5 font-mono text-[11px] text-foreground outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleClipboardPaste}
          aria-label={t("tutorials.pasteButtonAria")}
          data-testid="tutorial-paste-clipboard"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-primary bg-primary/10 text-primary hover:bg-primary/20"
        >
          <ClipboardPaste className="size-4" aria-hidden="true" />
        </button>
      </div>
      {pasteFailed ? (
        <div className="font-mono text-[10px] text-destructive">
          {t("tutorials.pasteFailed")}
        </div>
      ) : null}
      {isReady ? (
        <button
          type="button"
          data-testid="tutorial-paste-next"
          onClick={() => reportTutorialAction({ type: "paste-next" })}
          className="rounded-[2px] border border-primary bg-primary/10 px-2 py-1.5 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20"
        >
          {t("tutorials.controls.next")}
        </button>
      ) : null}
    </div>
  );
};

const modePath = (pathname: string): string =>
  pathname.replace(/^\/uk(?=\/|$)/, "") || "/";

const isTutorialRoute = (pathname: string, id: TutorialId): boolean =>
  modePath(pathname) === getTutorialPath(id, "en");

const SearchTutorialContent = ({
  description,
  onFill,
}: {
  description: ReactNode;
  onFill: () => void;
}) => (
  <div className="flex flex-col gap-3">
    <div>{description}</div>
    <button
      type="button"
      data-testid="tutorial-fill-search"
      onClick={onFill}
      className="rounded-[2px] border border-primary bg-primary/10 px-2 py-1.5 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20"
    >
      {t("tutorials.items.filtering.steps.search.fill")}
    </button>
  </div>
);

const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const locale = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTutorial, setActiveTutorial] = useState<TutorialId | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  const [pendingStart, setPendingStart] = useState<{
    id: TutorialId;
    consumeQuery: boolean;
  } | null>(null);
  const queryStartRef = useRef<string | null>(null);
  const searchSetterRef = useRef<((value: string) => void) | null>(null);
  const filteringResetterRef = useRef<TutorialFilteringResetter | null>(null);
  const advanceFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleViewportChange = () => setIsMobileViewport(mediaQuery.matches);

    handleViewportChange();
    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  const registerSearchSetter = useCallback((setter: (value: string) => void) => {
    searchSetterRef.current = setter;
    return () => {
      if (searchSetterRef.current === setter) {
        searchSetterRef.current = null;
      }
    };
  }, []);

  const registerFilteringResetter = useCallback(
    (resetter: TutorialFilteringResetter) => {
      filteringResetterRef.current = resetter;
      return () => {
        if (filteringResetterRef.current === resetter) {
          filteringResetterRef.current = null;
        }
      };
    },
    [],
  );

  const fillTutorialSearch = useCallback((value: string) => {
    searchSetterRef.current?.(value);
  }, []);
  const handleFillPackaged = useCallback(
    () => fillTutorialSearch("packaged"),
    [fillTutorialSearch],
  );

  const definition = getTutorialDefinition(activeTutorial ?? "swatches");
  const tutorialSteps = useMemo(
    () =>
      definition.steps.filter(
        (step) => !step.mobileOnly || isMobileViewport,
      ),
    [definition, isMobileViewport],
  );
  const steps: JoyrideTutorialStep[] = tutorialSteps.map((step, index) => ({
    id: step.id,
    target: () => findTutorialTarget(step.target),
    title: t(step.titleKey),
    content:
      step.id === "filtering-search" ? (
        <SearchTutorialContent
          description={t(step.contentKey)}
          onFill={handleFillPackaged}
        />
      ) : step.id === "accessibility-reset" ? (
        <AccessibilityResetTutorialContent description={t(step.contentKey)} />
      ) : step.id === "swatches-primary-paste" ||
        step.id === "swatches-secondary-paste" ||
        step.id === "harmony-paste" ? (
        <PasteTutorialContent description={t(step.contentKey)} />
      ) : (
        t(step.contentKey)
      ),
    kind: step.kind,
    requirement: step.requirement,
    ...(step.placement ? { placement: step.placement } : {}),
    ...(index === 0 || step.skipScroll ? { skipScroll: true } : {}),
    ...(step.id === "swatches-primary-paste" ||
    step.id === "swatches-secondary-paste" ||
    step.id === "harmony-paste"
      ? { blockTargetInteraction: true }
      : {}),
    buttons: step.kind === "action" ? ["back", "skip"] : ["back", "skip", "primary"],
    data: {
      kind: step.kind,
      requirement: step.requirement,
    },
  }));

  const endTutorial = useCallback(() => {
    if (advanceFrameRef.current !== null) {
      window.cancelAnimationFrame(advanceFrameRef.current);
      advanceFrameRef.current = null;
    }
    if (activeTutorial === "filtering") filteringResetterRef.current?.();
    setIsRunning(false);
    setActiveTutorial(null);
    setPendingStart(null);
  }, [activeTutorial]);

  const handleJoyrideEvent = useCallback(
    (event: EventData) => {
      if (
        event.type === EVENTS.TARGET_NOT_FOUND ||
        event.type === EVENTS.ERROR ||
        event.type === EVENTS.TOUR_END ||
        event.status === STATUS.FINISHED ||
        event.status === STATUS.SKIPPED
      ) {
        endTutorial();
      }
    },
    [endTutorial],
  );

  const joyride = useJoyride({
    continuous: true,
    run: isRunning,
    steps,
    onEvent: handleJoyrideEvent,
    scrollToFirstStep: false,
    locale: {
      back: t("tutorials.controls.back"),
      next: t("tutorials.controls.next"),
      last: t("tutorials.controls.finish"),
      skip: t("tutorials.controls.cancel"),
    },
    options: {
      buttons: ["back", "skip", "primary"],
      closeButtonAction: "skip",
      dismissKeyAction: "close",
      overlayClickAction: "close",
      showProgress: true,
      skipBeacon: true,
      spotlightPadding: 8,
      backgroundColor: "hsl(240 6% 10%)",
      textColor: "hsl(0 0% 90%)",
      arrowColor: "hsl(240 6% 10%)",
      primaryColor: "hsl(26 90% 60%)",
      overlayColor: "transparent",
      zIndex: 100,
    },
    styles: {
      tooltip: {
        backgroundColor: "hsl(240 6% 10%)",
        border: "1px solid hsl(26 90% 60% / 0.65)",
        borderRadius: "2px",
        boxShadow: "0 10px 28px rgba(0, 0, 0, 0.45)",
        color: "hsl(0 0% 90%)",
        fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
      },
      tooltipTitle: {
        color: "hsl(26 90% 60%)",
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      },
      tooltipContainer: {
        lineHeight: 1.6,
        textAlign: "left",
      },
      tooltipContent: {
        color: "hsl(0 0% 75%)",
        fontSize: "12px",
        lineHeight: 1.6,
      },
      spotlight: {
        fill: "transparent",
        stroke: "hsl(26 90% 60% / 0.9)",
        strokeDasharray: "4 3",
        strokeWidth: 2,
      },
      buttonPrimary: {
        backgroundColor: "hsl(26 90% 60%)",
        color: "hsl(240 10% 4%)",
        borderRadius: "2px",
        fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
      },
      buttonBack: {
        color: "hsl(26 90% 60%)",
        fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "11px",
        textTransform: "uppercase",
      },
      buttonSkip: {
        color: "hsl(240 4% 55%)",
        fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "11px",
        textTransform: "uppercase",
      },
    },
  });

  const startTutorial = useCallback(
    (id: TutorialId) => {
      if (modePath(location.pathname) !== getTutorialPath(id, "en")) {
        navigate(getTutorialUrl(id, locale, location.search, location.hash));
        return;
      }

      setPendingStart({ id, consumeQuery: false });
    },
    [locale, location.hash, location.pathname, location.search, navigate],
  );

  const cancelTutorial = useCallback(() => {
    endTutorial();
    joyride.controls.stop();
  }, [endTutorial, joyride.controls]);

  const advanceTutorial = useCallback(() => {
    if (advanceFrameRef.current !== null) {
      window.cancelAnimationFrame(advanceFrameRef.current);
      advanceFrameRef.current = null;
    }

    const nextStep = activeTutorial
      ? tutorialSteps[joyride.state.index + 1]
      : undefined;

    if (!nextStep) {
      joyride.controls.next();
      return;
    }

    const advanceWhenMounted = () => {
      if (findTutorialTarget(nextStep.target)) {
        advanceFrameRef.current = null;
        joyride.controls.next();
        return;
      }

      advanceFrameRef.current = window.requestAnimationFrame(advanceWhenMounted);
    };

    advanceWhenMounted();
  }, [activeTutorial, joyride.controls, joyride.state.index, tutorialSteps]);

  const reportTutorialAction = useCallback(
    (action: TutorialAction) => {
      if (!isRunning || !activeTutorial || !joyride.step) return;
      if (action.type === "paste-next") {
        advanceTutorial();
        return;
      }

      const requirement = (
        joyride.step.data as { requirement?: Parameters<typeof tutorialActionMatches>[1] } | undefined
      )?.requirement;
      if (!requirement || !tutorialActionMatches(action, requirement)) return;

      advanceTutorial();
    },
    [
      activeTutorial,
      advanceTutorial,
      isRunning,
      joyride.step,
    ],
  );

  useEffect(() => {
    const queryTutorial = getTutorialIdFromSearch(location.search);
    if (!queryTutorial || !isTutorialRoute(location.pathname, queryTutorial)) {
      return;
    }

    const queryKey = `${location.pathname}${location.search}${location.hash}`;
    if (queryStartRef.current === queryKey || pendingStart) return;
    queryStartRef.current = queryKey;
    setPendingStart({ id: queryTutorial, consumeQuery: true });
  }, [location.hash, location.pathname, location.search, pendingStart]);

  useEffect(() => {
    if (!pendingStart || activeTutorial) return;
    if (!isTutorialRoute(location.pathname, pendingStart.id)) {
      setPendingStart(null);
      return;
    }

    const { id, consumeQuery } = pendingStart;
    const firstTarget = getTutorialDefinition(id).steps.find(
      (step) => !step.mobileOnly || isMobileViewport,
    )?.target;
    if (!firstTarget) {
      setPendingStart(null);
      return;
    }
    let frameId = 0;
    let attempts = 0;

    const startWhenMounted = () => {
      attempts += 1;
      if (findTutorialTarget(firstTarget)) {
        setActiveTutorial(id);
        setIsRunning(true);
        setPendingStart(null);
        if (consumeQuery) {
          navigate(
            {
              pathname: location.pathname,
              search: removeTutorialQuery(location.search),
              hash: location.hash,
            },
            { replace: true },
          );
        }
        return;
      }

      if (attempts < 60) {
        frameId = window.requestAnimationFrame(startWhenMounted);
      } else {
        setPendingStart(null);
      }
    };

    frameId = window.requestAnimationFrame(startWhenMounted);
    return () => window.cancelAnimationFrame(frameId);
  }, [activeTutorial, isMobileViewport, location, navigate, pendingStart]);

  useEffect(() => {
    if (activeTutorial && !isTutorialRoute(location.pathname, activeTutorial)) {
      cancelTutorial();
    }
  }, [activeTutorial, cancelTutorial, location.pathname]);

  const contextValue = useMemo<TutorialContextValue>(
    () => ({
      activeTutorial,
      isRunning,
      startTutorial,
      cancelTutorial,
      reportTutorialAction,
      registerFilteringResetter,
      registerSearchSetter,
      fillTutorialSearch,
    }),
    [
      activeTutorial,
      isRunning,
      cancelTutorial,
      fillTutorialSearch,
      registerFilteringResetter,
      registerSearchSetter,
      reportTutorialAction,
      startTutorial,
    ],
  );

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      {joyride.Tour}
    </TutorialContext.Provider>
  );
};

export default TutorialProvider;
