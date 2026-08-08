"use client";

import { useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import {
   Trophy,
   Repeat,
   Calendar,
   Play,
   TrendingUp,
   Monitor,
   MapPin,
   Music,
   Tv,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { AnimatedNumber } from "~/components/ui/animated-number";
import { MediaDetailDialog } from "~/components/media/media-detail-dialog";
import type { PlexMediaItem } from "~/types/plex";
import type { getHighlightsCached } from "~/server/cache/analytics";

type Highlights = Awaited<ReturnType<typeof getHighlightsCached>>;

interface HighlightProps {
   icon: React.ElementType;
   label: string;
   // Either a plain string value or an animated number with an optional suffix.
   value?: string;
   numericValue?: number;
   suffix?: string;
   detail?: string;
   onClick?: () => void;
}

const Highlight: React.FC<HighlightProps & { index?: number }> = ({
   icon: Icon,
   label,
   value,
   numericValue,
   suffix,
   detail,
   onClick,
   index = 0,
}) => {
   const prefersReducedMotion = useReducedMotion();

   return (
      <m.div
         initial={{ opacity: 0, y: 8 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.25, delay: index * 0.04 }}
         whileHover={
            onClick && !prefersReducedMotion
               ? { y: -2, transition: { type: "spring", bounce: 0, duration: 0.4 } }
               : undefined
         }
         className={cn(
            "flex items-start gap-3 rounded-lg border border-border/50 bg-card p-4",
            onClick && "cursor-pointer transition-colors hover:border-primary/30",
         )}
         onClick={onClick}
      >
         <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
         </span>
         <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-sm font-medium tabular-nums">
               {numericValue !== undefined ? (
                  <>
                     <AnimatedNumber value={numericValue} />
                     {suffix ? ` ${suffix}` : null}
                  </>
               ) : (
                  value
               )}
            </p>
            {detail && (
               <p className="text-xs text-muted-foreground">{detail}</p>
            )}
         </div>
      </m.div>
   );
};

export const HighlightsGrid = ({ highlights }: { highlights: Highlights }) => {
   const [selectedItem, setSelectedItem] = useState<PlexMediaItem | null>(
      null,
   );

   const h = highlights;

   const openItem = (ratingKey: string, title: string, type: string) => {
      setSelectedItem({
         ratingKey,
         key: "",
         type: type === "episode" ? "show" : type,
         title,
         addedAt: 0,
      });
   };

   return (
      <section>
         <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Highlights
         </h2>
         <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {h.mostWatched && (
               <Highlight
                  icon={Trophy}
                  label="Most Watched"
                  value={h.mostWatched.title}
                  detail={`${h.mostWatched.plays} plays`}
                  onClick={() =>
                     openItem(
                        h.mostWatched!.ratingKey,
                        h.mostWatched!.title,
                        h.mostWatched!.type,
                     )
                  }
               />
            )}
            {h.mostRewatched && (
               <Highlight
                  icon={Repeat}
                  label="Most Rewatched"
                  value={h.mostRewatched.title}
                  detail={`Watched ${h.mostRewatched.plays} times`}
                  onClick={() =>
                     openItem(
                        h.mostRewatched!.ratingKey,
                        h.mostRewatched!.title,
                        h.mostRewatched!.type,
                     )
                  }
               />
            )}
            <Highlight
               icon={Play}
               label="Total Plays"
               numericValue={h.totalPlays}
            />
            <Highlight
               icon={Calendar}
               label="Active Days"
               numericValue={h.daysWithActivity}
               suffix="days"
            />
            <Highlight
               icon={TrendingUp}
               label="Daily Average"
               value={`${h.avgPlaysPerDay} plays/day`}
            />
            {h.topArtist && (
               <Highlight
                  icon={Music}
                  label="Top Artist"
                  value={h.topArtist.title}
                  detail={`${h.topArtist.plays} plays`}
               />
            )}
            {h.totalEpisodes > 0 && (
               <Highlight
                  icon={Tv}
                  label="Total Episodes"
                  numericValue={h.totalEpisodes}
               />
            )}
            {h.topDevice && (
               <Highlight
                  icon={Monitor}
                  label="Top Device"
                  value={h.topDevice.name}
                  detail={`${h.topDevice.plays} plays`}
               />
            )}
            {h.topLocation && (
               <Highlight
                  icon={MapPin}
                  label="Most Common Location"
                  value={h.topLocation}
               />
            )}
         </div>

         <MediaDetailDialog
            item={selectedItem}
            open={!!selectedItem}
            onOpenChange={(v) => {
               if (!v) setSelectedItem(null);
            }}
         />
      </section>
   );
};
