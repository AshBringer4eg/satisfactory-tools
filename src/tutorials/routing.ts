import type { TutorialId } from "./types";
import { getTutorialDefinition, TUTORIAL_IDS } from "./catalog";

export type TutorialLocale = "en" | "uk";

export const getTutorialPath = (id: TutorialId, locale: TutorialLocale): string => {
  const localePrefix = locale === "uk" ? "/uk" : "";
  return `${localePrefix}/${getTutorialDefinition(id).mode}/`;
};

export const getTutorialUrl = (
  id: TutorialId,
  locale: TutorialLocale,
  search = "",
  hash = "",
): string => {
  const params = new URLSearchParams(search);
  params.set("tutorial", id);
  const nextSearch = params.toString();
  return `${getTutorialPath(id, locale)}${nextSearch ? `?${nextSearch}` : ""}${hash}`;
};

export const getTutorialIdFromSearch = (search: string): TutorialId | null => {
  const id = new URLSearchParams(search).get("tutorial");
  if (!id || !TUTORIAL_IDS.includes(id as TutorialId)) return null;
  return id as TutorialId;
};

export const removeTutorialQuery = (search: string): string => {
  const params = new URLSearchParams(search);
  params.delete("tutorial");
  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : "";
};
