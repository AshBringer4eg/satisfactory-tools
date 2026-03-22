import { Terminal } from "lucide-react";

const AppHeader = () => (
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
);

export default AppHeader;
