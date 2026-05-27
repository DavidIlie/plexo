"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "~/lib/utils";

interface PlexImageProps {
   path: string | undefined;
   alt: string;
   width?: number;
   height?: number;
   className?: string;
   priority?: boolean;
   quality?: number;
}

export const PlexImage: React.FC<PlexImageProps> = ({
   path,
   alt,
   width = 300,
   height = 450,
   className,
   priority = false,
   quality = 8,
}) => {
   const [loaded, setLoaded] = useState(false);

   if (!path) {
      return (
         <div
            className={cn(
               "flex items-center justify-center rounded bg-muted text-[10px] text-muted-foreground/50",
               className,
            )}
         />
      );
   }

   return (
      <div className={cn("relative overflow-hidden", className)}>
         <div
            aria-hidden
            className={cn(
               "absolute inset-0 bg-muted transition-opacity duration-500",
               loaded ? "opacity-0" : "opacity-100",
            )}
         >
            <div className="plex-image-shimmer absolute inset-0" />
         </div>
         <Image
            src={`/api/plex-image?path=${encodeURIComponent(path)}&w=${width}&h=${height}&q=${quality}`}
            alt={alt}
            width={width}
            height={height}
            className={cn(
               "h-full w-full object-cover transition-opacity duration-500",
               loaded ? "opacity-100" : "opacity-0",
            )}
            priority={priority}
            unoptimized
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
         />
      </div>
   );
};
