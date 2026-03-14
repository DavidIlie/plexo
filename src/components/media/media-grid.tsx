"use client";

import { useState } from "react";
import type { PlexMediaItem } from "~/types/plex";
import { MediaCard } from "./media-card";
import { MediaDetailDialog } from "./media-detail-dialog";

interface MediaGridProps {
   items: PlexMediaItem[];
   showProgress?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
   items,
   showProgress = false,
}) => {
   const [selectedItem, setSelectedItem] = useState<PlexMediaItem | null>(null);

   return (
      <>
         <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {items.map((item) => (
               <MediaCard
                  key={item.ratingKey}
                  item={item}
                  showProgress={showProgress}
                  onClick={() => setSelectedItem(item)}
               />
            ))}
         </div>
         <MediaDetailDialog
            item={selectedItem}
            open={!!selectedItem}
            onOpenChange={(open) => {
               if (!open) setSelectedItem(null);
            }}
         />
      </>
   );
};
