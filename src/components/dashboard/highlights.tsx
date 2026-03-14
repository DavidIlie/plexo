"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Trophy, Repeat, Clapperboard, Calendar, Play, TrendingUp } from "lucide-react";

import { useTRPC } from "~/trpc/react";

interface HighlightProps {
   icon: React.ElementType;
   label: string;
   value: string;
   detail?: string;
}

const Highlight: React.FC<HighlightProps> = ({ icon: Icon, label, value, detail }) => (
   <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
         <p className="text-xs text-muted-foreground">{label}</p>
         <p className="truncate text-sm font-medium">{value}</p>
         {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
   </div>
);

export const Highlights = () => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.analytics.getHighlights.queryOptions(),
   );

   const h = data.data;

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
               />
            )}
            {h.mostRewatched && (
               <Highlight
                  icon={Repeat}
                  label="Most Rewatched"
                  value={h.mostRewatched.title}
                  detail={`Watched ${h.mostRewatched.plays} times`}
               />
            )}
            {h.longestMovie && (
               <Highlight
                  icon={Clapperboard}
                  label="Longest Movie"
                  value={h.longestMovie.title}
                  detail={`${Math.floor(h.longestMovie.duration / 60)}h ${h.longestMovie.duration % 60}m`}
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
         </div>
      </section>
   );
};
