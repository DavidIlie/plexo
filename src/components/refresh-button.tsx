"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export const RefreshButton = () => {
   const [spinning, setSpinning] = useState(false);
   const queryClient = useQueryClient();

   const handleRefresh = async () => {
      setSpinning(true);
      await queryClient.resetQueries();
      setTimeout(() => setSpinning(false), 800);
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
               "h-3 w-3 transition-transform",
               spinning && "animate-spin",
            )}
         />
         <span className="hidden sm:inline">Refresh</span>
      </Button>
   );
};
