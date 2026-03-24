import { useState, useEffect, useCallback } from "react";
import { appTabs, type AppTabId } from "@/config/tabs";
import AppHeader from "@/components/layout/AppHeader";
import AppTabBar from "@/components/layout/AppTabBar";
import AppTabContent from "@/components/layout/AppTabContent";
import AppFooter from "@/components/layout/AppFooter";
import {
  ALL_COPY_COUNT_STORAGE_KEYS,
  RESET_COPY_COUNTS_EVENT,
} from "@/config/storage";
import { useLocale } from "@/i18n";

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

  const clearAllCopyCounters = useCallback(() => {
    for (const storageKey of ALL_COPY_COUNT_STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage failures.
      }
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    } catch {
      // Ignore storage write failures.
    }
  }, [activeTab]);

  useEffect(() => {
    const handleResetCounters = () => {
      clearAllCopyCounters();
    };

    window.addEventListener(RESET_COPY_COUNTS_EVENT, handleResetCounters);
    return () => {
      window.removeEventListener(RESET_COPY_COUNTS_EVENT, handleResetCounters);
    };
  }, [clearAllCopyCounters]);

  const handleResetCounters = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    clearAllCopyCounters();
    window.dispatchEvent(new Event(RESET_COPY_COUNTS_EVENT));
  }, [clearAllCopyCounters]);

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
