import { Suspense } from "react";

import { Skeleton } from "~/components/ui/skeleton";
import { AnalyticsContent, ChartsFallback } from "./analytics-content";

const AnalyticsPage = () => {
   return (
      <div className="space-y-6">
         <Suspense
            fallback={
               <>
                  <div className="flex items-center justify-between">
                     <div>
                        <h1 className="text-lg font-semibold">Analytics</h1>
                        <p className="text-sm text-muted-foreground">
                           Watch patterns and library insights
                        </p>
                     </div>
                     <Skeleton className="h-8 w-[140px]" />
                  </div>
                  <ChartsFallback />
               </>
            }
         >
            <AnalyticsContent />
         </Suspense>
      </div>
   );
};
export default AnalyticsPage;
