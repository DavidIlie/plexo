import { cn } from "~/lib/utils";

interface WatchProgressProps {
   viewed: number;
   total: number;
   className?: string;
}

export const WatchProgress: React.FC<WatchProgressProps> = ({
   viewed,
   total,
   className,
}) => {
   const percentage = total > 0 ? Math.round((viewed / total) * 100) : 0;

   return (
      <div className={cn("space-y-1", className)}>
         <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">
               {viewed}/{total} episodes
            </span>
            <span className="shrink-0 tabular-nums">{percentage}%</span>
         </div>
         <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
               className={cn(
                  "h-full origin-left rounded-full transition-transform duration-300",
                  percentage === 100 ? "bg-green-500" : "bg-primary",
               )}
               style={{ transform: `scaleX(${percentage / 100})` }}
            />
         </div>
      </div>
   );
};
