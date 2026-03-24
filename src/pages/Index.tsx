import { useState, useEffect, useCallback } from "react";
import { appTabs, type AppTabId } from "@/config/tabs";
import AppHeader from "@/components/layout/AppHeader";
import AppTabBar from "@/components/layout/AppTabBar";
import AppTabContent from "@/components/layout/AppTabContent";
import AppFooter from "@/components/layout/AppFooter";
import { useLocale } from "@/i18n";

const COPY_COUNTS_STORAGE_KEY = "ficsit-color-copy-counts";
const RESET_COPY_COUNTS_EVENT = "ficsit:reset-copy-counters";
const ACTIVE_TAB_STORAGE_KEY = "ficsit-active-tab";

const DEFAULT_TAB_ID: AppTabId = "solo";
const readStoredTab = (): AppTabId => {
  if (typeof window === "undefined") return DEFAULT_TAB_ID;

  try {
    const stored = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (stored && appTabs.some((tab) => tab.id === stored)) {
      return stored as AppTabId;
    }
  } catch {
    // Ignore storage access failures.
  }

  return DEFAULT_TAB_ID;
};

const Index = () => {
  const activeLocale = useLocale();
  const [activeTab, setActiveTab] = useState<AppTabId>(() => readStoredTab());

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
    <div className="min-h-screen min-w-[220px] bg-background flex flex-col" data-locale={activeLocale}>
      <AppHeader />
      <AppTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <AppTabContent activeTab={activeTab} />
      <AppFooter onResetCounters={handleResetCounters} />
    </div>
  );
};

export default Index;
