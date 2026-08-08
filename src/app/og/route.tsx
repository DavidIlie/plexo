import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "@takumi-rs/image-response";
import { type NextRequest } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "~/env";
import { CACHE_TAGS } from "~/lib/cache-tags";
import {
   getLibrarySections,
   getMovies,
   getShows,
   getArtists,
   getMetadata,
   getChildren,
} from "~/lib/plex";
import { getHistory } from "~/lib/tautulli";
import { findSection } from "~/lib/plex-sections";

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

const fontDir = join(process.cwd(), "public", "fonts");

const FONTS = [
   {
      name: "Geist",
      data: readFileSync(join(fontDir, "Geist-Regular.ttf")),
      weight: 400,
   },
   {
      name: "Geist",
      data: readFileSync(join(fontDir, "Geist-SemiBold.ttf")),
      weight: 600,
   },
   {
      name: "Geist",
      data: readFileSync(join(fontDir, "Geist-Bold.ttf")),
      weight: 700,
   },
   {
      name: "Geist Mono",
      data: readFileSync(join(fontDir, "GeistMono-Medium.ttf")),
      weight: 500,
   },
   {
      name: "Geist Mono",
      data: readFileSync(join(fontDir, "GeistMono-Bold.ttf")),
      weight: 700,
   },
];

/* ------------------------------------------------------------------ */
/* Icons (lucide paths, 24x24 viewBox)                                 */
/* ------------------------------------------------------------------ */

type IconKey =
   | "dashboard"
   | "film"
   | "tv"
   | "music"
   | "chart"
   | "activity"
   | "clock"
   | "disc";

/* Fragments serialize to "" in takumi's SVG stringifier, so use keyed arrays. */
const ICON_PATHS: Record<IconKey, React.ReactNode[]> = {
   dashboard: [
      <rect key="a" width="7" height="9" x="3" y="3" rx="1" />,
      <rect key="b" width="7" height="5" x="14" y="3" rx="1" />,
      <rect key="c" width="7" height="9" x="14" y="12" rx="1" />,
      <rect key="d" width="7" height="5" x="3" y="16" rx="1" />,
   ],
   film: [
      <rect key="a" width="18" height="18" x="3" y="3" rx="2" />,
      <path key="b" d="M7 3v18" />,
      <path key="c" d="M3 7.5h4" />,
      <path key="d" d="M3 12h18" />,
      <path key="e" d="M3 16.5h4" />,
      <path key="f" d="M17 3v18" />,
      <path key="g" d="M21 7.5h-4" />,
      <path key="h" d="M21 16.5h-4" />,
   ],
   tv: [
      <rect key="a" width="20" height="15" x="2" y="7" rx="2" ry="2" />,
      <polyline key="b" points="17 2 12 7 7 2" />,
   ],
   music: [
      <path key="a" d="M9 18V5l12-2v13" />,
      <circle key="b" cx="6" cy="18" r="3" />,
      <circle key="c" cx="18" cy="16" r="3" />,
   ],
   chart: [
      <path key="a" d="M3 3v18h18" />,
      <path key="b" d="M18 17V9" />,
      <path key="c" d="M13 17V5" />,
      <path key="d" d="M8 17v-3" />,
   ],
   activity: [
      <path
         key="a"
         d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
      />,
   ],
   clock: [
      <circle key="a" cx="12" cy="12" r="10" />,
      <polyline key="b" points="12 6 12 12 16 14" />,
   ],
   disc: [
      <circle key="a" cx="12" cy="12" r="10" />,
      <path key="b" d="M6 12c0-1.7.7-3.2 1.8-4.2" />,
      <circle key="c" cx="12" cy="12" r="2" />,
      <path key="d" d="M18 12c0 1.7-.7 3.2-1.8 4.2" />,
   ],
};

const Icon = ({
   name,
   size,
   color,
   strokeWidth = 2,
   opacity = 1,
}: {
   name: IconKey;
   size: number;
   color: string;
   strokeWidth?: number;
   opacity?: number;
}) => (
   <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "flex" }}
   >
      <g
         fill="none"
         stroke={color}
         strokeWidth={strokeWidth}
         strokeLinecap="round"
         strokeLinejoin="round"
         opacity={opacity}
      >
         {ICON_PATHS[name]}
      </g>
   </svg>
);

/* ------------------------------------------------------------------ */
/* Per-page configuration                                              */
/* ------------------------------------------------------------------ */

interface PageConfig {
   eyebrow: string;
   icon: IconKey;
   primary: string;
   title: (name: string) => string;
}

const PAGE_CONFIG: Record<string, PageConfig> = {
   dashboard: {
      eyebrow: "MEDIA LIBRARY",
      icon: "dashboard",
      primary: "Movies",
      title: (name) => `${name}'s Library`,
   },
   movies: {
      eyebrow: "MOVIE LIBRARY",
      icon: "film",
      primary: "Movies",
      title: (name) => `${name}'s Movies`,
   },
   tv: {
      eyebrow: "TV LIBRARY",
      icon: "tv",
      primary: "Shows",
      title: (name) => `${name}'s TV Shows`,
   },
   music: {
      eyebrow: "MUSIC LIBRARY",
      icon: "music",
      primary: "Artists",
      title: (name) => `${name}'s Music`,
   },
   analytics: {
      eyebrow: "WATCH ANALYTICS",
      icon: "chart",
      primary: "Hours Watched",
      title: (name) => `${name}'s Analytics`,
   },
   activity: {
      eyebrow: "WATCH HISTORY",
      icon: "activity",
      primary: "Hours Watched",
      title: (name) => `${name}'s Activity`,
   },
};

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const getStats = async () => {
   "use cache";
   cacheLife("analytics");
   cacheTag(
      CACHE_TAGS.analytics,
      CACHE_TAGS.analyticsScope("ogStats"),
      CACHE_TAGS.plex,
      CACHE_TAGS.tautulli,
   );

   const sections = await getLibrarySections();
   const movieSection = findSection(sections, "movie");
   const showSection = findSection(sections, "show");
   const musicSection = findSection(sections, "artist");

   const totalMovies = movieSection
      ? (await getMovies(movieSection.key)).totalSize
      : 0;
   const totalShows = showSection
      ? (await getShows(showSection.key)).totalSize
      : 0;
   const totalArtists = musicSection
      ? (await getArtists(musicSection.key)).totalSize
      : 0;

   // Mirror getDashboardStatsCached: sum play_duration so the OG number
   // matches the dashboard's Hours Watched stat.
   const history = await getHistory(5000);
   let totalSeconds = 0;
   for (const item of history.data) {
      totalSeconds += item.play_duration || 0;
   }
   const hoursWatched = Math.round(totalSeconds / 3600);

   return { totalMovies, totalShows, totalArtists, hoursWatched };
};

const getArtistData = async (ratingKey: string) => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.plexItem(ratingKey));

   const artist = await getMetadata(ratingKey);
   if (!artist?.title || artist.type !== "artist") return null;

   const albums = await getChildren(ratingKey);
   let totalPlays = 0;
   for (const album of albums) {
      totalPlays += album.viewCount ?? 0;
   }

   return {
      title: artist.title,
      genres: (artist.Genre ?? []).slice(0, 3).map((g) => g.tag),
      thumb: artist.thumb ?? null,
      albumCount: albums.length,
      totalPlays,
   };
};

/* ------------------------------------------------------------------ */
/* Shared layout pieces                                                */
/* ------------------------------------------------------------------ */

const AMBER = "#e5a00d";

const Header = ({ icon }: { icon: IconKey }) => (
   <div
      style={{
         display: "flex",
         alignItems: "center",
         justifyContent: "space-between",
      }}
   >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
         <div
            style={{
               width: "46px",
               height: "46px",
               background:
                  "linear-gradient(135deg, rgba(229,160,13,0.18), rgba(20,20,20,1))",
               border: "1px solid rgba(229,160,13,0.3)",
               borderRadius: "10px",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
            }}
         >
            <svg
               width="24"
               height="24"
               viewBox="0 0 32 32"
               fill="none"
               style={{ display: "flex" }}
            >
               <path d="M12 9L24 16L12 23V9Z" fill={AMBER} />
            </svg>
         </div>
         <span
            style={{
               fontSize: "27px",
               fontWeight: 600,
               letterSpacing: "-0.02em",
               color: AMBER,
               display: "flex",
            }}
         >
            plexo
         </span>
      </div>
      <div
         style={{
            width: "46px",
            height: "46px",
            backgroundColor: "rgba(23,23,23,0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
         }}
      >
         <Icon name={icon} size={22} color={AMBER} opacity={0.85} />
      </div>
   </div>
);

const Footer = ({ chip }: { chip: string }) => (
   <div
      style={{
         display: "flex",
         alignItems: "center",
         justifyContent: "space-between",
      }}
   >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
         <div
            style={{
               width: "6px",
               height: "6px",
               borderRadius: "50%",
               backgroundColor: AMBER,
               display: "flex",
            }}
         />
         <span style={{ fontSize: "17px", color: "#737373", display: "flex" }}>
            Personal Media Dashboard
         </span>
      </div>
      <div
         style={{
            display: "flex",
            padding: "8px 18px",
            borderRadius: "100px",
            border: "1px solid rgba(229,160,13,0.3)",
            backgroundColor: "rgba(229,160,13,0.06)",
         }}
      >
         <span
            style={{
               fontSize: "15px",
               fontWeight: 600,
               letterSpacing: "0.14em",
               color: AMBER,
               display: "flex",
            }}
         >
            {chip}
         </span>
      </div>
   </div>
);

interface StatItem {
   label: string;
   value: string;
   icon: IconKey;
   primary: boolean;
}

const StatTile = ({ stat }: { stat: StatItem }) => (
   <div
      style={{
         display: "flex",
         flexDirection: "column",
         gap: "10px",
         padding: "20px 26px",
         minWidth: "190px",
         borderRadius: "12px",
         backgroundColor: "rgba(23,23,23,0.85)",
         border: "1px solid rgba(255,255,255,0.08)",
      }}
   >
      <div
         style={{
            height: "2px",
            width: "44px",
            background: "linear-gradient(90deg, #e5a00d, rgba(229,160,13,0))",
            borderRadius: "2px",
            display: "flex",
         }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
         <Icon name={stat.icon} size={16} color={AMBER} opacity={0.7} />
         <span style={{ fontSize: "16px", color: "#a3a3a3", display: "flex" }}>
            {stat.label}
         </span>
      </div>
      <span
         style={{
            fontSize: "44px",
            fontWeight: 700,
            color: stat.primary ? AMBER : "#fafafa",
            letterSpacing: "-0.02em",
            fontFamily: "Geist Mono",
            display: "flex",
         }}
      >
         {stat.value}
      </span>
   </div>
);

const Card = ({
   icon,
   children,
}: {
   icon: IconKey;
   children: React.ReactNode;
}) => (
   <div
      style={{
         width: "100%",
         height: "100%",
         display: "flex",
         backgroundColor: "#0a0a0a",
         backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(229,160,13,0.06) 1px, transparent 1px)",
         backgroundSize: "32px 32px",
         color: "#e5e5e5",
         fontFamily: "Geist",
      }}
   >
      {/* top-right amber glow */}
      <div
         style={{
            position: "absolute",
            top: "-260px",
            right: "-160px",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background:
               "radial-gradient(circle, rgba(229,160,13,0.14) 0%, transparent 65%)",
            display: "flex",
         }}
      />
      {/* bottom-left counterweight glow */}
      <div
         style={{
            position: "absolute",
            bottom: "-200px",
            left: "-140px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
               "radial-gradient(circle, rgba(229,160,13,0.05) 0%, transparent 65%)",
            display: "flex",
         }}
      />
      {/* page glyph watermark — centered in the right-side dead zone */}
      <div
         style={{
            position: "absolute",
            right: "72px",
            top: "170px",
            display: "flex",
         }}
      >
         <Icon name={icon} size={290} color={AMBER} strokeWidth={1} opacity={0.08} />
      </div>
      {/* top accent bar */}
      <div
         style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "1200px",
            height: "4px",
            background:
               "linear-gradient(90deg, rgba(229,160,13,0) 0%, #e5a00d 35%, #f6c453 50%, #e5a00d 65%, rgba(229,160,13,0) 100%)",
            display: "flex",
         }}
      />
      {/* inset frame */}
      <div
         style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            margin: "28px",
            borderRadius: "20px",
            border: "1px solid rgba(229,160,13,0.12)",
            padding: "44px 56px",
         }}
      >
         {children}
      </div>
   </div>
);

/* ------------------------------------------------------------------ */
/* Renderers                                                           */
/* ------------------------------------------------------------------ */

const imageOptions = (sMaxAge: number) => ({
   width: 1200,
   height: 630,
   format: "png" as const,
   fonts: FONTS,
   headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=86400`,
   },
});

const renderPageOG = (
   config: PageConfig,
   title: string,
   stats: StatItem[],
   sMaxAge: number,
) =>
   new ImageResponse(
      <Card icon={config.icon}>
         <Header icon={config.icon} />

         <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <span
               style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  color: AMBER,
                  display: "flex",
               }}
            >
               {config.eyebrow}
            </span>
            <span
               style={{
                  fontSize: "70px",
                  fontWeight: 700,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                  color: "#fafafa",
                  display: "flex",
               }}
            >
               {title}
            </span>
            {stats.length > 0 && (
               <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                  {stats.map((stat) => (
                     <StatTile key={stat.label} stat={stat} />
                  ))}
               </div>
            )}
         </div>

         <Footer chip={config.eyebrow} />
      </Card>,
      imageOptions(sMaxAge),
   );

const renderArtistOG = (
   artist: NonNullable<Awaited<ReturnType<typeof getArtistData>>>,
) => {
   const thumbUrl = artist.thumb
      ? `${env.PLEX_URL}/photo/:/transcode?width=400&height=400&url=${encodeURIComponent(artist.thumb)}&X-Plex-Token=${env.PLEX_TOKEN}`
      : null;

   const stats: StatItem[] = [
      {
         label: artist.albumCount === 1 ? "Album" : "Albums",
         value: artist.albumCount.toLocaleString(),
         icon: "disc",
         primary: true,
      },
   ];
   if (artist.totalPlays > 0) {
      stats.push({
         label: artist.totalPlays === 1 ? "Play" : "Plays",
         value: artist.totalPlays.toLocaleString(),
         icon: "activity",
         primary: false,
      });
   }

   return new ImageResponse(
      <Card icon="music">
         <Header icon="music" />

         <div style={{ display: "flex", alignItems: "center" }}>
            <div
               style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  gap: "20px",
                  marginRight: "48px",
               }}
            >
               <span
                  style={{
                     fontSize: "16px",
                     fontWeight: 600,
                     letterSpacing: "0.22em",
                     color: AMBER,
                     display: "flex",
                  }}
               >
                  ARTIST
               </span>
               <span
                  style={{
                     fontSize: artist.title.length > 18 ? "54px" : "70px",
                     fontWeight: 700,
                     letterSpacing: "-0.035em",
                     lineHeight: 1.05,
                     color: "#fafafa",
                     display: "flex",
                  }}
               >
                  {artist.title}
               </span>
               {artist.genres.length > 0 && (
                  <div style={{ display: "flex", gap: "10px" }}>
                     {artist.genres.map((g) => (
                        <span
                           key={g}
                           style={{
                              fontSize: "17px",
                              color: "#d4d4d4",
                              backgroundColor: "rgba(23,23,23,0.85)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              padding: "6px 16px",
                              borderRadius: "100px",
                              display: "flex",
                           }}
                        >
                           {g}
                        </span>
                     ))}
                  </div>
               )}
               <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                  {stats.map((stat) => (
                     <StatTile key={stat.label} stat={stat} />
                  ))}
               </div>
            </div>

            {thumbUrl && (
               <div
                  style={{
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                  }}
               >
                  <div
                     style={{
                        position: "absolute",
                        width: "420px",
                        height: "420px",
                        borderRadius: "50%",
                        background:
                           "radial-gradient(circle, rgba(229,160,13,0.15) 0%, transparent 65%)",
                        display: "flex",
                     }}
                  />
                  <div
                     style={{
                        display: "flex",
                        padding: "6px",
                        borderRadius: "22px",
                        border: "1px solid rgba(229,160,13,0.25)",
                        backgroundColor: "rgba(229,160,13,0.05)",
                     }}
                  >
                     <img
                        src={thumbUrl}
                        width={300}
                        height={300}
                        style={{ borderRadius: "16px", objectFit: "cover" }}
                     />
                  </div>
               </div>
            )}
         </div>

         <Footer chip="MUSIC LIBRARY" />
      </Card>,
      imageOptions(1800),
   );
};

/** Static branded fallback — built from constants only, no fetches. */
const renderFallbackOG = () =>
   new ImageResponse(
      <Card icon="dashboard">
         <Header icon="dashboard" />

         <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <span
               style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  color: AMBER,
                  display: "flex",
               }}
            >
               PLEXO
            </span>
            <span
               style={{
                  fontSize: "70px",
                  fontWeight: 700,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                  color: "#fafafa",
                  display: "flex",
               }}
            >
               Personal Media Dashboard
            </span>
         </div>

         <Footer chip="PLEXO" />
      </Card>,
      imageOptions(60),
   );

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export const GET = async (req: NextRequest) => {
   const page = req.nextUrl.searchParams.get("page") ?? "dashboard";
   const artistKey = req.nextUrl.searchParams.get("artist");

   try {
      if (page === "artist" && artistKey) {
         // Unknown keys make plexFetch throw; treat that the same as a
         // non-artist ratingKey and fall through to the generic card.
         const artist = await getArtistData(artistKey).catch(() => null);
         if (artist) return renderArtistOG(artist);
      }

      const config = PAGE_CONFIG[page] ?? PAGE_CONFIG.dashboard!;
      const stats = await getStats();
      const name = env.DISPLAY_NAME;

      const allStats: StatItem[] = [
         {
            label: "Movies",
            value: stats.totalMovies.toLocaleString(),
            icon: "film",
            primary: false,
         },
         {
            label: "Shows",
            value: stats.totalShows.toLocaleString(),
            icon: "tv",
            primary: false,
         },
         {
            label: "Artists",
            value: stats.totalArtists.toLocaleString(),
            icon: "music",
            primary: false,
         },
         {
            label: "Hours Watched",
            value: stats.hoursWatched.toLocaleString(),
            icon: "clock",
            primary: false,
         },
      ];

      const rawValues: Record<string, number> = {
         Movies: stats.totalMovies,
         Shows: stats.totalShows,
         Artists: stats.totalArtists,
         "Hours Watched": stats.hoursWatched,
      };

      const visible = allStats.filter((s) => (rawValues[s.label] ?? 0) > 0);
      const ordered = [
         ...visible.filter((s) => s.label === config.primary),
         ...visible.filter((s) => s.label !== config.primary),
      ].map((s, i) => ({ ...s, primary: i === 0 }));

      return renderPageOG(config, config.title(name), ordered, 900);
   } catch {
      return renderFallbackOG();
   }
};
