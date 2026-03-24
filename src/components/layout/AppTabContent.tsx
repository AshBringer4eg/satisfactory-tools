import { motion, AnimatePresence } from "framer-motion";
import { appTabs, type AppTabId } from "@/config/tabs";

interface AppTabContentProps {
  activeTab: AppTabId;
}

const getTabId = (tabId: AppTabId): string => `app-tab-${tabId}`;
const getTabPanelId = (tabId: AppTabId): string => `app-tabpanel-${tabId}`;

const AppTabContent = ({ activeTab }: AppTabContentProps) => {
  const currentTab = appTabs.find((tab) => tab.id === activeTab);
  if (!currentTab) return null;
  const CurrentTabComponent = currentTab.component;

  return (
    <main className="flex-1 p-6 overflow-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          id={getTabPanelId(activeTab)}
          role="tabpanel"
          aria-labelledby={getTabId(activeTab)}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
        >
          <CurrentTabComponent />
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

export default AppTabContent;
