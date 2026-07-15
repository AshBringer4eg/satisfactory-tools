import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { NavLink } from "react-router-dom";
import { appTabs, type AppTabId } from "@/config/tabs";
import { t, useLocale } from "@/i18n";
import { getModeShareUrl } from "@/lib/share-links";

interface AppTabBarProps {
  activeTab: AppTabId;
  onTabChange: (tabId: AppTabId) => void;
}

const getTabId = (tabId: AppTabId): string => `app-tab-${tabId}`;
const getTabPanelId = (tabId: AppTabId): string => `app-tabpanel-${tabId}`;

const AppTabBar = ({ activeTab, onTabChange }: AppTabBarProps) => {
  const activeLocale = useLocale();
  const [shareStatus, setShareStatus] = useState<"copied" | "failed" | null>(null);
  const shareStatusTimeout = useRef<number | null>(null);

  useEffect(() => () => {
    if (shareStatusTimeout.current !== null) {
      window.clearTimeout(shareStatusTimeout.current);
    }
  }, []);

  const handleModeShare = () => {
    const resetStatus = () => {
      if (shareStatusTimeout.current !== null) {
        window.clearTimeout(shareStatusTimeout.current);
      }
      shareStatusTimeout.current = window.setTimeout(() => {
        setShareStatus(null);
        shareStatusTimeout.current = null;
      }, 1400);
    };
    const clipboard = navigator.clipboard;
    if (!clipboard?.writeText) {
      setShareStatus("failed");
      resetStatus();
      return;
    }
    void clipboard.writeText(getModeShareUrl(activeTab)).then(
      () => setShareStatus("copied"),
      () => setShareStatus("failed"),
    ).finally(resetStatus);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLAnchorElement>,
    tabId: AppTabId,
  ) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const currentIndex = appTabs.findIndex((tab) => tab.id === tabId);
    if (currentIndex < 0) return;

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + appTabs.length) % appTabs.length;
    const nextTab = appTabs[nextIndex];
    onTabChange(nextTab.id);
  };

  return (
    <div className="flex shrink-0 border-b border-border min-w-0">
    <nav
      className="px-6 flex flex-1 gap-0 min-w-0"
      aria-label="Palette tabs"
      role="tablist"
    >
      {appTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <NavLink
            key={tab.id}
            to={`${activeLocale === "uk" ? "/uk" : ""}/${tab.id}/`}
            id={getTabId(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={getTabPanelId(tab.id)}
            aria-label={t(tab.labelKey)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
            className={`relative flex min-w-0 flex-1 items-center justify-center gap-2 px-4 py-3 text-[12px] font-bold uppercase tracking-wider transition-colors duration-150 ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{t(tab.labelKey)}</span>
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
              />
            )}
          </NavLink>
        );
      })}
    </nav>
    <button
      type="button"
      onClick={handleModeShare}
      aria-label={t("tabs.modeShare.copyAria", { mode: t(`tabs.${activeTab}`) })}
      title={t("tabs.modeShare.copyAria", { mode: t(`tabs.${activeTab}`) })}
      className="flex shrink-0 items-center gap-1 border-l border-border px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
    >
      <Share2 className="size-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">
        {shareStatus === "copied"
          ? t("tabs.modeShare.copied")
          : shareStatus === "failed"
            ? t("tabs.modeShare.failed")
            : t("tabs.modeShare.share")}
      </span>
    </button>
    </div>
  );
};

export default AppTabBar;
