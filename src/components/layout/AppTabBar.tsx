import { motion } from "framer-motion";
import { appTabs, type AppTabId } from "@/config/tabs";
import { t } from "@/i18n";

interface AppTabBarProps {
  activeTab: AppTabId;
  onTabChange: (tabId: AppTabId) => void;
}

const AppTabBar = ({ activeTab, onTabChange }: AppTabBarProps) => (
  <nav className="border-b border-border px-6 flex gap-0 shrink-0 min-w-0">
    {appTabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
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
        </button>
      );
    })}
  </nav>
);

export default AppTabBar;
