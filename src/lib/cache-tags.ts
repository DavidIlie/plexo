export const CACHE_ROOTS = [
   "plex",
   "tautulli",
   "analytics",
   "recommend",
   "tmdb",
   "overseerr",
   "geo",
] as const;

export type CacheRoot = (typeof CACHE_ROOTS)[number];

export const ALL_ROOTS: readonly CacheRoot[] = CACHE_ROOTS;

export const CACHE_TAGS = {
   plex: "plex",
   tautulli: "tautulli",
   analytics: "analytics",
   recommend: "recommend",
   tmdb: "tmdb",
   overseerr: "overseerr",
   geo: "geo",
   plexSections: "plex:sections",
   plexOnDeck: "plex:onDeck",
   plexRecentlyAdded: "plex:recentlyAdded",
   tautulliHistory: "tautulli:history",
   tautulliHomeStats: "tautulli:homeStats",
   tautulliPlaysByDate: "tautulli:playsByDate",
   tautulliPlaysByDayOfWeek: "tautulli:playsByDayOfWeek",
   tautulliPlaysByHourOfDay: "tautulli:playsByHourOfDay",
   tautulliMostWatched: "tautulli:mostWatched",
   tmdbSearch: "tmdb:search",
   recommendLibraryTitles: "recommend:libraryTitles",
   recommendWishlist: "recommend:wishlist",
   section: (id: string | number) => `plex:section:${id}`,
   plexItem: (rk: string | number) => `plex:item:${rk}`,
   genres: (sectionId: string | number) => `plex:genres:${sectionId}`,
   tautulliItem: (rk: string | number) => `tautulli:item:${rk}`,
   user: (id: string | number) => `tautulli:user:${id}`,
   geoIp: (ip: string) => `geo:${ip}`,
   analyticsScope: (name: string) => `analytics:${name}`,
} as const;

export const isCacheRoot = (name: string): name is CacheRoot =>
   (CACHE_ROOTS as readonly string[]).includes(name);

export const scope = (name: string): CacheRoot | null =>
   isCacheRoot(name) ? name : null;
