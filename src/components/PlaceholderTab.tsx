import { Construction } from "lucide-react";

interface PlaceholderTabProps {
  title: string;
  description: string;
}

const PlaceholderTab = ({ title, description }: PlaceholderTabProps) => (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <Construction className="w-10 h-10 text-muted-foreground" />
    <div className="text-center">
      <h2 className="font-mono text-[13px] font-bold uppercase tracking-wider text-foreground">
        {title}
      </h2>
      <p className="font-mono text-[12px] text-muted-foreground mt-1">
        {description}
      </p>
    </div>
  </div>
);

export default PlaceholderTab;
