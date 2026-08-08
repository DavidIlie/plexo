"use client";

import { useState } from "react";
import type { PlexMediaItem } from "~/types/plex";
import { MediaCard } from "./media-card";
import { MediaDetailDialog } from "./media-detail-dialog";
import { MEDIA_GRID_CLASSES } from "~/components/skeletons";

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
         <div className={MEDIA_GRID_CLASSES}>
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
