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
         <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
               {viewed}/{total} episodes
            </span>
            <span>{percentage}%</span>
         </div>
         <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
               className={cn(
                  "h-full rounded-full transition-all",
                  percentage === 100 ? "bg-green-500" : "bg-primary",
               )}
               style={{ width: `${percentage}%` }}
            />
         </div>
      </div>
   );
};
