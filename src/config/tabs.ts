import type { ComponentType } from "react";
import { Palette, SwatchBook, PencilRuler } from "lucide-react";
import SoloTab from "@/components/tabs/SoloTab";
import DuoTab from "@/components/tabs/DuoTab";
import OwnTab from "@/components/tabs/OwnTab";

export type AppTabDefinition = {
  id: "solo" | "duo" | "own";
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  component: ComponentType;
};

export const appTabs: AppTabDefinition[] = [
  { id: "solo", labelKey: "tabs.solo", icon: Palette, component: SoloTab },
  { id: "duo", labelKey: "tabs.duo", icon: SwatchBook, component: DuoTab },
  { id: "own", labelKey: "tabs.own", icon: PencilRuler, component: OwnTab },
];

export type AppTabId = AppTabDefinition["id"];
