import { useState, useEffect, useCallback } from "react";
import { Palette, FlaskConical, Clock, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ColorsTab from "@/components/ColorsTab";
import PlaceholderTab from "@/components/PlaceholderTab";

const COPY_COUNTS_STORAGE_KEY = "ficsit-color-copy-counts";
const RESET_COPY_COUNTS_EVENT = "ficsit:reset-copy-counters";
const ACTIVE_TAB_STORAGE_KEY = "ficsit-active-tab";

const tabs = [
  { id: "default", label: "Default", icon: Palette },
  { id: "alternative-1", label: "Alter. 1", icon: FlaskConical }
] as const;

type TabId = (typeof tabs)[number]["id"];
const DEFAULT_TAB_ID: TabId = "default";
const readStoredTab = (): TabId => {
  if (typeof window === "undefined") return DEFAULT_TAB_ID;

  try {
    const stored = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (stored && tabs.some((tab) => tab.id === stored)) {
      return stored as TabId;
    }
  } catch {
    // Ignore storage access failures.
  }

  return DEFAULT_TAB_ID;
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>(() => readStoredTab());

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    } catch {
      // Ignore storage write failures.
    }
  }, [activeTab]);

  const handleResetCounters = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      window.localStorage.removeItem(COPY_COUNTS_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
    window.dispatchEvent(new Event(RESET_COPY_COUNTS_EVENT));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-primary" />
          <h1 className="font-mono text-[12px] font-bold uppercase tracking-wider text-foreground">
            ENGINEER_REFERENCE_TERMINAL
          </h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            {`// VER ${__APP_VERSION__}`}
          </span>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="border-b border-border px-6 flex gap-0 shrink-0 min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex min-w-0 flex-1 items-center justify-center gap-2 px-4 py-3 text-[12px] font-bold uppercase tracking-wider transition-colors duration-150 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
          >
            {activeTab === "default" && <ColorsTab />}
            {activeTab === "alternative-1" && (
              <PlaceholderTab
                title="ALTERNATIVE_1"
                description="- under construction"
              />
            )}
            {activeTab === "alternative-2" && (
              <PlaceholderTab
                title="ALTERNATIVE_2"
                description="- under construction"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Status bar */}
      <footer className="border-t border-border px-6 py-2 flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-muted-foreground">
            FICSIT_EMPLOYEE_TOOLKIT
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            CLICK_SWATCH_TO_COPY_HEX
          </span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="font-mono text-[10px] text-muted-foreground leading-tight">
            THANKS_FOR_COLOR_DATA:
            {" "}
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/154vft6/vencams_colour_list_25/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              UNKNOWN_AUTHOR
            </a>
            {" "}
            |
            {" "}
            <a
              href="https://www.reddit.com/r/SatisfactoryGame/comments/1ft4tb8/i_made_a_list_of_item_colors_for_10/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              SQUIDCRAFT_101
            </a>
            {" "}
            |
            {" "}
            ME :)
          </div>
          <button
            type="button"
            onClick={handleResetCounters}
            className="shrink-0 font-mono text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            RESET_COUNTERS
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Index;
