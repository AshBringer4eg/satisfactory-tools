import type { TutorialAction, TutorialActionRequirement } from "./types";

export const tutorialActionMatches = (
  action: TutorialAction,
  requirement: TutorialActionRequirement,
): boolean => {
  if (action.type !== requirement.type) return false;

  switch (requirement.type) {
    case "copy":
      return action.type === "copy" && action.zone === requirement.zone;
    case "search": {
      if (action.type !== "search") return false;
      const value = action.value.trim();
      return (
        value.length >= requirement.minLength &&
        (!requirement.expectedValue ||
          value.toLowerCase() === requirement.expectedValue.toLowerCase())
      );
    }
    case "category":
      return (
        action.type === "category" &&
        (!requirement.code || action.code === requirement.code)
      );
    case "open-harmony":
    case "harmony-mode":
    case "harmony-copy":
    case "paste-result":
    case "open-accessibility":
    case "open-filter-menu":
    case "vision-mode":
      return true;
    case "accessibility-drawer":
      return action.type === "accessibility-drawer" && action.phase === requirement.phase;
    case "factory-safe":
      return action.type === "factory-safe" && action.enabled === requirement.enabled;
    case "toggle-symbols":
      return action.type === "toggle-symbols" && action.enabled === requirement.enabled;
    case "toggle-patterns":
      return action.type === "toggle-patterns" && action.enabled === requirement.enabled;
    case "reset-accessibility":
    case "apply-accessibility":
      return true;
  }
};
