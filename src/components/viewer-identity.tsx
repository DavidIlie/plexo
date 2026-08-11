"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";

import { cn } from "~/lib/utils";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "~/components/ui/tooltip";
import type { ActivityViewer } from "~/types/tautulli";

const avatarSize = {
   xs: "h-4 w-4",
   sm: "h-5 w-5",
   md: "h-6 w-6",
} as const;

const avatarPixels = {
   xs: 16,
   sm: 20,
   md: 24,
} as const;

export const ViewerAvatar = ({
   viewer,
   size = "sm",
   className,
}: {
   viewer: ActivityViewer;
   size?: keyof typeof avatarSize;
   className?: string;
}) => {
   const [imageFailed, setImageFailed] = useState(false);
   const showImage = viewer.hasAvatar && !imageFailed;
   const pixels = avatarPixels[size];

   return (
      <span
         className={cn(
            "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground ring-1 ring-border/70",
            avatarSize[size],
            className,
         )}
      >
         {showImage ? (
            <Image
               src={`/api/viewer-avatar/${encodeURIComponent(viewer.id)}`}
               alt=""
               width={pixels}
               height={pixels}
               sizes={`${pixels}px`}
               className="h-full w-full object-cover"
               onError={() => setImageFailed(true)}
            />
         ) : (
            <UserRound className="h-3/5 w-3/5" aria-hidden="true" />
         )}
      </span>
   );
};

export const ViewerIdentity = ({
   viewer,
   className,
}: {
   viewer: ActivityViewer | undefined;
   className?: string;
}) => {
   if (!viewer) return null;

   const identity = (
      <span
         className={cn(
            "inline-flex min-w-0 items-center gap-1.5",
            !viewer.name &&
               "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            className,
         )}
         aria-label={`Viewer: ${viewer.name ?? viewer.label}`}
         tabIndex={viewer.name ? undefined : 0}
      >
         {viewer.showAvatar || !viewer.name ? (
            <ViewerAvatar viewer={viewer} size="xs" />
         ) : (
            <UserRound className="h-3 w-3 shrink-0" aria-hidden="true" />
         )}
         {viewer.name ? <span className="truncate">{viewer.name}</span> : null}
      </span>
   );

   if (viewer.name) return identity;

   return (
      <TooltipProvider delayDuration={250}>
         <Tooltip>
            <TooltipTrigger asChild>{identity}</TooltipTrigger>
            <TooltipContent side="top" className="px-2 py-1 text-xs">
               {viewer.label}
            </TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
};

export const ViewerStack = ({ viewers }: { viewers: ActivityViewer[] }) => {
   if (viewers.length < 2 || !viewers.some((viewer) => viewer.showAvatar)) {
      return null;
   }

   const visible = viewers.slice(0, 4);
   const remaining = viewers.length - visible.length;

   return (
      <span
         className="flex items-center -space-x-1.5"
         aria-label={`${viewers.length} viewers`}
      >
         {visible.map((viewer) => (
            <ViewerAvatar
               key={viewer.id}
               viewer={viewer}
               size="sm"
               className="ring-2 ring-background"
            />
         ))}
         {remaining > 0 ? (
            <span className="relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[9px] font-medium text-muted-foreground ring-2 ring-background">
               +{remaining}
            </span>
         ) : null}
      </span>
   );
};
