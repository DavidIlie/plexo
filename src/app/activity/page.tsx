import { Suspense } from "react";
import { connection } from "next/server";

import { getHistoryWindow } from "~/server/cache/history";
import { Skeleton } from "~/components/ui/skeleton";
import { ActivityBrowser } from "./activity-browser";

const FIRST_PAGE_LEN = 30;

const ActivityFallback = () => (
   <div className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-9 w-full rounded-md" />
      <div className="space-y-2">
         {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
         ))}
      </div>
   </div>
);

// Server child reads the cached, unfiltered history window directly and renders
// the browser leaf with real data baked into the static shell. The browser keeps
// infinite-scroll/filter via tautulli.browseHistory; this just seeds page one.
const ActivityContent = async () => {
   await connection();
   const window = await getHistoryWindow(FIRST_PAGE_LEN, 0, undefined);

   return (
      <ActivityBrowser
         initialItems={window.data}
         initialTotal={window.recordsFiltered}
      />
   );
};

const ActivityPage = () => {
   return (
      <Suspense fallback={<ActivityFallback />}>
         <ActivityContent />
      </Suspense>
   );
};
export default ActivityPage;
