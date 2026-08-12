import { createContext, useContext } from "react";
import type { TutorialAction, TutorialId } from "./types";

type TutorialSearchSetter = (value: string) => void;
type TutorialFilteringResetter = () => void;

export interface TutorialContextValue {
  activeTutorial: TutorialId | null;
  isRunning: boolean;
  startTutorial: (id: TutorialId) => void;
  cancelTutorial: () => void;
  reportTutorialAction: (action: TutorialAction) => void;
  registerSearchSetter: (setter: TutorialSearchSetter) => () => void;
  registerFilteringResetter: (resetter: TutorialFilteringResetter) => () => void;
  fillTutorialSearch: (value: string) => void;
}

const inactiveTutorialContext: TutorialContextValue = {
  activeTutorial: null,
  isRunning: false,
  startTutorial: () => undefined,
  cancelTutorial: () => undefined,
  reportTutorialAction: () => undefined,
  registerSearchSetter: () => () => undefined,
  registerFilteringResetter: () => () => undefined,
  fillTutorialSearch: () => undefined,
};

export const TutorialContext = createContext<TutorialContextValue>(
  inactiveTutorialContext,
);

export const useTutorial = (): TutorialContextValue =>
  useContext(TutorialContext);
