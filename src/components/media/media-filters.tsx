"use client";

import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "~/components/ui/select";

interface MediaFiltersProps {
   search: string;
   onSearchChange: (value: string) => void;
   genre: string;
   onGenreChange: (value: string) => void;
   genres: string[];
   statusFilter?: string;
   onStatusFilterChange?: (value: string) => void;
   statusOptions?: Array<{ value: string; label: string }>;
   qualityFilter?: string;
   onQualityFilterChange?: (value: string) => void;
   qualityOptions?: Array<{ value: string; label: string }>;
}

export const MediaFilters: React.FC<MediaFiltersProps> = ({
   search,
   onSearchChange,
   genre,
   onGenreChange,
   genres,
   statusFilter,
   onStatusFilterChange,
   statusOptions,
   qualityFilter,
   onQualityFilterChange,
   qualityOptions,
}) => {
   return (
      <div className="flex flex-col gap-3 sm:flex-row">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
               placeholder="Search..."
               value={search}
               onChange={(e) => onSearchChange(e.target.value)}
               className="pl-9"
            />
         </div>
         <Select value={genre} onValueChange={onGenreChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
               <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">All Genres</SelectItem>
               {genres.map((g) => (
                  <SelectItem key={g} value={g}>
                     {g}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>
         {statusOptions && onStatusFilterChange && (
            <Select
               value={statusFilter ?? "all"}
               onValueChange={onStatusFilterChange}
            >
               <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  {statusOptions.map((opt) => (
                     <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         )}
         {qualityOptions && onQualityFilterChange && (
            <Select
               value={qualityFilter ?? "all"}
               onValueChange={onQualityFilterChange}
            >
               <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  {qualityOptions.map((opt) => (
                     <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         )}
      </div>
   );
};
