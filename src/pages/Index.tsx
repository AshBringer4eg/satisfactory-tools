import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { AppTabId } from "@/config/tabs";
import AppHeader from "@/components/layout/AppHeader";
import AppTabBar from "@/components/layout/AppTabBar";
import AppTabContent from "@/components/layout/AppTabContent";
import AppFooter from "@/components/layout/AppFooter";
import { ColorAccessibilityProvider } from "@/components/accessibility/ColorAccessibilityProvider";
import {
  ALL_COPY_COUNT_STORAGE_KEYS,
  RESET_COPY_COUNTS_EVENT,
} from "@/config/storage";
import { useLocale } from "@/i18n";

const ACTIVE_TAB_STORAGE_KEY = "ficsit-active-tab";

interface IndexProps {
  initialTab: AppTabId;
}

const Index = ({ initialTab }: IndexProps) => {
  const activeLocale = useLocale();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AppTabId>(initialTab);

  const handleTabChange = useCallback((tabId: AppTabId) => {
    setActiveTab(tabId);
    void navigate(`/${tabId}/`);
  }, [navigate]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
      <div className="min-h-screen min-w-[220px] bg-background flex flex-col" data-locale={activeLocale}>
        <AppHeader />
        <AppTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        <AppTabContent activeTab={activeTab} />
        <AppFooter onResetCounters={handleResetCounters} />
      </div>
    </ColorAccessibilityProvider>
  );
};

export default Index;
