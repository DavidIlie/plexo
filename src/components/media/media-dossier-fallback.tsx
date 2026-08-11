import { Skeleton } from "~/components/ui/skeleton";

export const MediaDossierFallback = () => (
   <div className="space-y-6" aria-busy="true" aria-label="Loading media analytics">
      <Skeleton className="h-8 w-32" />
      <div className="overflow-hidden rounded-xl border border-border/50">
         <div className="grid gap-5 p-5 sm:grid-cols-[128px_minmax(0,1fr)] sm:p-7">
            <Skeleton className="hidden aspect-[2/3] w-32 rounded-lg sm:block" />
            <div className="space-y-4">
               <Skeleton className="h-3 w-24" />
               <Skeleton className="h-9 w-2/3" />
               <div className="flex gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
               </div>
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-4/5" />
            </div>
         </div>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/50 p-5 sm:grid-cols-4">
         {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
               <Skeleton className="h-3 w-20" />
               <Skeleton className="h-5 w-24" />
            </div>
         ))}
      </div>
      <div className="rounded-lg border border-border/50 p-4">
         <Skeleton className="h-4 w-28" />
         <Skeleton className="mt-2 h-3 w-48" />
         <Skeleton className="mt-4 h-[280px] w-full" />
      </div>
   </div>
);
