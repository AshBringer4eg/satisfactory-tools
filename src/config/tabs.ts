import type { ComponentType } from "react";
import { Palette, SwatchBook, PencilRuler } from "lucide-react";
import SoloTab from "@/components/tabs/SoloTab";
import DuoTab from "@/components/tabs/DuoTab";
import OwnTab from "@/components/tabs/OwnTab";

export type AppTabDefinition = {
  id: "solo" | "duo" | "own";
  label: string;
  icon: ComponentType<{ className?: string }>;
  component: ComponentType;
};

export const appTabs: AppTabDefinition[] = [
  { id: "solo", label: "SOLO", icon: Palette, component: SoloTab },
  { id: "duo", label: "DUO", icon: SwatchBook, component: DuoTab },
  { id: "own", label: "OWN", icon: PencilRuler, component: OwnTab },
];

export type AppTabId = AppTabDefinition["id"];
