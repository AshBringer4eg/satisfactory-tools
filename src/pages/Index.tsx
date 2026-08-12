import { useState, useEffect, useCallback } from "react";
import type { AppTabId } from "@/config/tabs";
import AppHeader from "@/components/layout/AppHeader";
import AppTabBar from "@/components/layout/AppTabBar";
import AppTabContent from "@/components/layout/AppTabContent";
import AppFooter from "@/components/layout/AppFooter";
import { ColorAccessibilityProvider } from "@/components/accessibility/ColorAccessibilityProvider";
import TutorialProvider from "@/tutorials/TutorialProvider";
import {
  ALL_COPY_COUNT_STORAGE_KEYS,
  RESET_COPY_COUNTS_EVENT,
} from "@/config/storage";
import { setLocale, useLocale } from "@/i18n";

const ACTIVE_TAB_STORAGE_KEY = "ficsit-active-tab";

interface IndexProps {
  initialTab: AppTabId;
  initialLocale?: "en" | "uk";
}

const Index = ({ initialTab, initialLocale = "en" }: IndexProps) => {
  const activeLocale = useLocale();
  const [activeTab, setActiveTab] = useState<AppTabId>(initialTab);

  const handleTabChange = useCallback((tabId: AppTabId) => {
    setActiveTab(tabId);
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

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
    <ColorAccessibilityProvider>
      <TutorialProvider>
        <div className="min-h-screen min-w-[220px] bg-background flex flex-col" data-locale={activeLocale}>
          <AppHeader />
          <AppTabBar activeTab={activeTab} onTabChange={handleTabChange} />
          <AppTabContent activeTab={activeTab} />
          <AppFooter onResetCounters={handleResetCounters} />
        </div>
      </TutorialProvider>
    </ColorAccessibilityProvider>
  );
};

export default Index;
