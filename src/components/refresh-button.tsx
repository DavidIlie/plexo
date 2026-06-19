"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export const RefreshButton = () => {
   const [spinning, setSpinning] = useState(false);
   const router = useRouter();
   const queryClient = useQueryClient();

   const handleRefresh = async () => {
      setSpinning(true);
      // Re-render server components (e.g. the directly-rendered DashboardStats)
      // AND refetch client queries. This pulls the latest cached value and, if
      // an entry is past its `revalidate` window, triggers background SWR.
      // Purging the server cache itself requires the admin RefreshDialog
      // (revalidateTag needs the admin secret).
      router.refresh();
      await queryClient.invalidateQueries();
      setSpinning(false);
   };

   return (
      <Button
         variant="ghost"
         size="sm"
         className="h-7 gap-1.5 text-xs text-muted-foreground"
         onClick={handleRefresh}
         disabled={spinning}
      >
         <RefreshCw
            className={cn(
               "h-3 w-3",
               spinning && "animate-spin",
            )}
         />
         <span className="hidden sm:inline">Refresh</span>
      </Button>
   );
};
