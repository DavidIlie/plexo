"use client";

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

import { useTRPC } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { MediaDetailDialog } from "~/components/media/media-detail-dialog";
import type { PlexMediaItem } from "~/types/plex";

interface HighlightProps {
   icon: React.ElementType;
   label: string;
   value: string;
   detail?: string;
   onClick?: () => void;
}

const Highlight: React.FC<HighlightProps & { index?: number }> = ({
   icon: Icon,
   label,
   value,
   detail,
   onClick,
   index = 0,
}) => (
   <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={cn(
         "flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3",
         onClick && "cursor-pointer transition-colors hover:border-primary/30",
      )}
      onClick={onClick}
   >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
      <div className="min-w-0">
         <p className="text-xs text-muted-foreground">{label}</p>
         <p className="truncate text-sm font-medium">{value}</p>
         {detail && (
            <p className="text-xs text-muted-foreground">{detail}</p>
         )}
      </div>
   </motion.div>
);

export const Highlights = () => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.analytics.getHighlights.queryOptions(),
   );
   const [selectedItem, setSelectedItem] = useState<PlexMediaItem | null>(
      null,
   );

   const h = data.data;

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
         <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
               value={h.totalPlays.toLocaleString()}
            />
            <Highlight
               icon={Calendar}
               label="Active Days"
               value={`${h.daysWithActivity} days`}
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
                  value={h.totalEpisodes.toLocaleString()}
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
