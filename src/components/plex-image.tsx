"use client";

import Image from "next/image";
import { cn } from "~/lib/utils";

interface PlexImageProps {
   path: string | undefined;
   alt: string;
   width?: number;
   height?: number;
   className?: string;
   priority?: boolean;
}

export const PlexImage: React.FC<PlexImageProps> = ({
   path,
   alt,
   width = 300,
   height = 450,
   className,
   priority = false,
}) => {
   if (!path) {
      return (
         <div
            className={cn(
               "flex items-center justify-center bg-muted text-muted-foreground",
               className,
            )}
            style={{ width, height }}
         >
            No Image
         </div>
      );
   }

   return (
      <Image
         src={`/api/plex-image?path=${encodeURIComponent(path)}&w=${width}&h=${height}`}
         alt={alt}
         width={width}
         height={height}
         className={className}
         priority={priority}
         unoptimized
      />
   );
};
