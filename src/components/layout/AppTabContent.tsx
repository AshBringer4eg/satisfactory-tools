import { motion, AnimatePresence } from "framer-motion";
import { appTabs, type AppTabId } from "@/config/tabs";
import { t } from "@/i18n";

interface AppTabContentProps {
  activeTab: AppTabId;
}

const getTabId = (tabId: AppTabId): string => `app-tab-${tabId}`;
const getTabPanelId = (tabId: AppTabId): string => `app-tabpanel-${tabId}`;
const formatTerminalHeading = (heading: string): string =>
  heading.toLocaleUpperCase().replace(/\s+/g, "_");

const AppTabContent = ({ activeTab }: AppTabContentProps) => {
  const currentTab = appTabs.find((tab) => tab.id === activeTab);
  if (!currentTab) return null;
  const CurrentTabComponent = currentTab.component;
  const introTitle = t(`modeIntro.${activeTab}.title`);

  return (
    <main className="flex-1 p-6 overflow-auto" data-route-scroll-container>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="h-full min-h-0"
          id={getTabPanelId(activeTab)}
          role="tabpanel"
          aria-labelledby={getTabId(activeTab)}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
        >
          <section className="mb-4 max-w-4xl">
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              <span className="sr-only">{introTitle}</span>
              <span aria-hidden="true">{formatTerminalHeading(introTitle)}</span>
            </h1>
            <p className="mt-1 text-sm uppercase leading-relaxed text-muted-foreground">
              {t(`modeIntro.${activeTab}.description`)}
            </p>
          </section>
          <CurrentTabComponent />
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

export default AppTabContent;
