import { useState, useMemo, useCallback } from "react";

import { useIntersectionObserver } from "~/hooks/use-intersection-observer";

interface PaginatedPage<T> {
   items: T[];
   nextCursor?: number;
}

export const usePaginatedBrowse = <T>({
   initialItems,
   totalSize,
   fetchPage,
}: {
   initialItems: T[];
   totalSize: number;
   fetchPage: (cursor: number) => Promise<PaginatedPage<T>>;
}) => {
   const [extraItems, setExtraItems] = useState<T[]>([]);
   const [cursor, setCursor] = useState<number | undefined>(
      initialItems.length < totalSize ? initialItems.length : undefined,
   );
   const [loadingMore, setLoadingMore] = useState(false);

   const items = useMemo(
      () => [...initialItems, ...extraItems],
      [initialItems, extraItems],
   );

   const loadMore = useCallback(async () => {
      if (cursor === undefined || loadingMore) return;
      setLoadingMore(true);
      try {
         const page = await fetchPage(cursor);
         setExtraItems((prev) => [...prev, ...page.items]);
         setCursor(page.nextCursor ?? undefined);
      } finally {
         setLoadingMore(false);
      }
   }, [cursor, loadingMore, fetchPage]);

   const sentinelRef = useIntersectionObserver(
      () => void loadMore(),
      cursor !== undefined,
   );

   return { items, loadingMore, sentinelRef, hasNextPage: cursor !== undefined };
};
