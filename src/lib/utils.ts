import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
   return twMerge(clsx(inputs));
};

interface HistoryTitleItem {
   media_type: string;
   grandparent_title: string;
   parent_media_index: number;
   media_index: number;
   title: string;
   full_title: string;
}

export const formatHistoryTitle = (item: HistoryTitleItem) => {
   if (item.media_type === "episode" && item.grandparent_title) {
      const season = item.parent_media_index;
      const episode = item.media_index;
      if (season != null && episode != null) {
         return `${item.grandparent_title} · S${season}E${episode} · ${item.title}`;
      }
   }
   return item.full_title;
};
