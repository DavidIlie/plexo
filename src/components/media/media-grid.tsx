import type { PlexMediaItem } from "~/types/plex";
import { MediaCard } from "./media-card";

interface MediaGridProps {
   items: PlexMediaItem[];
   showProgress?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
   items,
   showProgress = false,
}) => {
   return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
         {items.map((item) => (
            <MediaCard
               key={item.ratingKey}
               item={item}
               showProgress={showProgress}
            />
         ))}
      </div>
   );
};
