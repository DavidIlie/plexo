"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Film, Tv, Clock, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

import { useTRPC } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { PlexImage } from "~/components/plex-image";

const statusConfig = {
   pending: { label: "Pending", icon: Clock, className: "text-amber-500" },
   approved: { label: "Approved", icon: Check, className: "text-blue-500" },
   processing: { label: "Processing", icon: Loader2, className: "text-blue-500" },
   available: { label: "Available", icon: Check, className: "text-green-500" },
   watchlist: { label: "Watchlist", icon: Clock, className: "text-primary" },
} as const;

export const Wishlist = () => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.recommend.getWishlist.queryOptions(),
   );

   if (data.data.length === 0) return null;

   return (
      <section>
         <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Wishlist
         </h2>
         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.data.map((item, i) => {
               const config = statusConfig[item.status];
               const StatusIcon = config.icon;
               const isTmdbPoster =
                  item.posterPath && !item.posterPath.startsWith("/library");
               const isPlexPoster =
                  item.posterPath && item.posterPath.startsWith("/library");

               return (
                  <motion.div
                     key={item.id}
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.2, delay: i * 0.03 }}
                     className="group"
                  >
                     <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
                        {isTmdbPoster && (
                           <Image
                              src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                           />
                        )}
                        {isPlexPoster && (
                           <PlexImage
                              path={item.posterPath!}
                              alt={item.title}
                              width={300}
                              height={450}
                              className="h-full w-full object-cover"
                           />
                        )}
                        {!item.posterPath && (
                           <div className="flex h-full items-center justify-center">
                              {item.mediaType === "movie" ? (
                                 <Film className="h-8 w-8 text-muted-foreground/40" />
                              ) : (
                                 <Tv className="h-8 w-8 text-muted-foreground/40" />
                              )}
                           </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                           <Badge
                              variant="secondary"
                              className={`gap-1 text-[10px] ${config.className}`}
                           >
                              <StatusIcon className="h-2.5 w-2.5" />
                              {config.label}
                           </Badge>
                        </div>
                     </div>
                     <div className="mt-1.5 min-w-0">
                        <p className="truncate text-xs font-medium">
                           {item.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                           {item.year}
                           {item.requestedBy && ` · ${item.requestedBy}`}
                           {item.requestedAt &&
                              ` · ${formatDistanceToNow(new Date(item.requestedAt), { addSuffix: true })}`}
                        </p>
                     </div>
                  </motion.div>
               );
            })}
         </div>
      </section>
   );
};
