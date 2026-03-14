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

const shimmer = (w: number, h: number) =>
   `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop stop-color="#1a1a1a" offset="0%"/><stop stop-color="#262626" offset="50%"/><stop stop-color="#1a1a1a" offset="100%"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`;

const toBase64 = (str: string) =>
   typeof window === "undefined"
      ? Buffer.from(str).toString("base64")
      : btoa(str);

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
               "flex items-center justify-center bg-muted text-xs text-muted-foreground",
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
         placeholder="blur"
         blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`}
      />
   );
};
