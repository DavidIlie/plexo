/**
 * Cache-tag taxonomy for the `use cache: remote` data layer.
 *
 * Tags let `/api/refresh` and `revalidateTag()` target invalidation precisely
 * (e.g. one section, one title, or all of Plex) instead of nuking everything.
 * Every cached function attaches its domain root plus any relevant scoped tags.
 */

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

/** All domain root tags — used for a full refresh. */
export const ALL_ROOTS: readonly CacheRoot[] = CACHE_ROOTS;

export const CACHE_TAGS = {
   // ── domain roots ────────────────────────────────────────────────────────
   plex: "plex",
   tautulli: "tautulli",
   analytics: "analytics",
   recommend: "recommend",
   tmdb: "tmdb",
   overseerr: "overseerr",
   geo: "geo",

   // ── plex globals ────────────────────────────────────────────────────────
   plexSections: "plex:sections",
   plexOnDeck: "plex:onDeck",
   plexRecentlyAdded: "plex:recentlyAdded",

   // ── tautulli globals ────────────────────────────────────────────────────
   tautulliHistory: "tautulli:history",
   tautulliHomeStats: "tautulli:homeStats",
   tautulliPlaysByDate: "tautulli:playsByDate",
   tautulliPlaysByDayOfWeek: "tautulli:playsByDayOfWeek",
   tautulliPlaysByHourOfDay: "tautulli:playsByHourOfDay",
   tautulliMostWatched: "tautulli:mostWatched",

   // ── recommend / tmdb globals ──────────────────────────────────────────────
   tmdbSearch: "tmdb:search",
   recommendLibraryTitles: "recommend:libraryTitles",
   recommendWishlist: "recommend:wishlist",

   // ── scoped builders (per-entity) ──────────────────────────────────────────
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

/** Resolve a `/api/refresh?scope=` value to its root tag, or null if unknown. */
export const scope = (name: string): CacheRoot | null =>
   isCacheRoot(name) ? name : null;
