import type { LucideIcon } from "lucide-react";

interface StatCardProps {
   icon: LucideIcon;
   label: string;
   value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({
   icon: Icon,
   label,
   value,
}) => {
   return (
      <div className="rounded-lg border border-border/50 bg-card p-4">
         <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span className="text-xs">{label}</span>
         </div>
         <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </div>
   );
};
