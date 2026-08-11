"use client";

import { useTransition, type CSSProperties } from "react";
import { parseAsString, useQueryState } from "nuqs";

import { ViewerAvatar } from "~/components/viewer-identity";
import { cn } from "~/lib/utils";
import type { ActivityViewer } from "~/types/tautulli";

type StackStyle = CSSProperties & {
   "--viewer-stack-offset": string;
};

export const AnalyticsViewerSelector = ({
   viewers,
}: {
   viewers: ActivityViewer[];
}) => {
   const [isPending, startTransition] = useTransition();
   const [viewerId, setViewerId] = useQueryState(
      "viewer",
      parseAsString.withOptions({
         history: "push",
         shallow: false,
         startTransition,
      }),
   );

   if (viewers.length < 2) return null;

   const selectedViewer = viewers.find((viewer) => viewer.id === viewerId);

   return (
      <div className="flex items-center gap-2">
         <div
            className="group/viewers flex items-center"
            role="group"
            aria-busy={isPending}
            aria-label="Filter analytics by viewer"
         >
            {viewers.map((viewer, index) => {
               const selected = viewer.id === viewerId;
               const label = selected
                  ? `Show all viewers instead of ${viewer.label}`
                  : `View analytics for ${viewer.label}`;
               const style: StackStyle = {
                  "--viewer-stack-offset": `${index * -10}px`,
                  zIndex: selected ? viewers.length + 1 : viewers.length - index,
               };

               return (
                  <button
                     key={viewer.id}
                     type="button"
                     aria-label={label}
                     aria-pressed={selected}
                     title={selected ? "Show all viewers" : viewer.label}
                     onClick={() => void setViewerId(selected ? null : viewer.id)}
                     className={cn(
                        "relative inline-flex h-8 w-8 shrink-0 translate-x-[var(--viewer-stack-offset)] items-center justify-center rounded-full transition-transform duration-250 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/viewers:translate-x-0 group-focus-within/viewers:translate-x-0 hover:-translate-y-0.5 focus-visible:z-20 focus-visible:translate-x-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 motion-reduce:transform-none motion-reduce:transition-none [@media(hover:none)]:h-11 [@media(hover:none)]:w-11 [@media(hover:none)]:translate-x-0",
                        selected &&
                           "z-20 ring-2 ring-primary ring-offset-2 ring-offset-background",
                        isPending && !selected && "opacity-70",
                     )}
                     style={style}
                  >
                     <ViewerAvatar
                        viewer={viewer}
                        size="md"
                        className="ring-2 ring-background"
                     />
                  </button>
               );
            })}
         </div>

         {selectedViewer ? (
            <button
               type="button"
               onClick={() => void setViewerId(null)}
               className="hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary transition-[transform,background-color] duration-150 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 motion-reduce:transition-none sm:inline-flex"
            >
               All viewers
            </button>
         ) : null}
      </div>
   );
};
