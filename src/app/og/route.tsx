import { ImageResponse } from "@takumi-rs/image-response";
import { type NextRequest } from "next/server";
import { env } from "~/env";
import { getCachedOrFetch, CacheTTL } from "~/lib/cache";
import { getLibrarySections, getMovies, getShows, getArtists, getMetadata, getChildren } from "~/lib/plex";
import { getHistory } from "~/lib/tautulli";

const getStats = async () => {
   const { data } = await getCachedOrFetch(
      "og:stats",
      async () => {
         const sections = await getLibrarySections();
         const movieSection = sections.find((s) => s.type === "movie");
         const showSection = sections.find((s) => s.type === "show");

         const musicSection = sections.find((s) => s.type === "artist");

         const totalMovies = movieSection
            ? (await getMovies(movieSection.key)).totalSize
            : 0;
         const totalShows = showSection
            ? (await getShows(showSection.key)).totalSize
            : 0;
         const totalArtists = musicSection
            ? (await getArtists(musicSection.key)).totalSize
            : 0;

         const history = await getHistory(1000);
         const hoursWatched = Math.round(
            parseInt(history.total_duration) / 3600,
         );

         return { totalMovies, totalShows, totalArtists, hoursWatched };
      },
      CacheTTL.ANALYTICS,
   );
   return data;
};

const getArtistOG = async (ratingKey: string) => {
   const artist = await getMetadata(ratingKey);
   if (!artist) return null;

   const albums = await getChildren(ratingKey);
   let totalPlays = 0;
   for (const album of albums) {
      totalPlays += album.viewCount ?? 0;
   }

   const genres = (artist.Genre ?? []).slice(0, 3).map((g) => g.tag);
   const thumbUrl = artist.thumb
      ? `${env.PLEX_URL}/photo/:/transcode?width=400&height=400&url=${encodeURIComponent(artist.thumb)}&X-Plex-Token=${env.PLEX_TOKEN}`
      : null;

   return new ImageResponse(
      <div
         style={{
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundColor: "#0a0a0a",
            color: "#e5e5e5",
            padding: "56px 72px",
         }}
      >
         <div
            style={{
               position: "absolute",
               top: "-150px",
               right: "-80px",
               width: "500px",
               height: "500px",
               borderRadius: "50%",
               background:
                  "radial-gradient(circle, rgba(229,160,13,0.12) 0%, transparent 70%)",
               display: "flex",
            }}
         />

         <div
            style={{
               display: "flex",
               flex: 1,
               flexDirection: "column",
               justifyContent: "space-between",
            }}
         >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               <div
                  style={{
                     width: "40px",
                     height: "40px",
                     backgroundColor: "#1a1a1a",
                     borderRadius: "8px",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                  }}
               >
                  <svg
                     width="20"
                     height="20"
                     viewBox="0 0 32 32"
                     fill="none"
                     style={{ display: "flex" }}
                  >
                     <path d="M12 9L24 16L12 23V9Z" fill="#e5a00d" />
                  </svg>
               </div>
               <span
                  style={{
                     fontSize: "24px",
                     fontWeight: 600,
                     letterSpacing: "-0.02em",
                     color: "#e5a00d",
                     display: "flex",
                  }}
               >
                  plexo
               </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
               <span
                  style={{
                     fontSize: "56px",
                     fontWeight: 700,
                     letterSpacing: "-0.03em",
                     lineHeight: 1.1,
                     display: "flex",
                  }}
               >
                  {artist.title}
               </span>

               {genres.length > 0 && (
                  <div style={{ display: "flex", gap: "8px" }}>
                     {genres.map((g) => (
                        <span
                           key={g}
                           style={{
                              fontSize: "18px",
                              color: "#a3a3a3",
                              backgroundColor: "#1a1a1a",
                              padding: "4px 14px",
                              borderRadius: "100px",
                              display: "flex",
                           }}
                        >
                           {g}
                        </span>
                     ))}
                  </div>
               )}

               <div style={{ display: "flex", gap: "40px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                     <span
                        style={{ fontSize: "40px", fontWeight: 800, color: "#e5a00d", display: "flex" }}
                     >
                        {albums.length}
                     </span>
                     <span style={{ fontSize: "18px", color: "#525252", display: "flex" }}>
                        Albums
                     </span>
                  </div>
                  {totalPlays > 0 && (
                     <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span
                           style={{ fontSize: "40px", fontWeight: 800, color: "#e5a00d", display: "flex" }}
                        >
                           {totalPlays.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "18px", color: "#525252", display: "flex" }}>
                           Plays
                        </span>
                     </div>
                  )}
               </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
               <div
                  style={{
                     display: "flex",
                     padding: "10px 24px",
                     background: "#1a1a1a",
                     borderRadius: "100px",
                     border: "1px solid rgba(229,160,13,0.3)",
                  }}
               >
                  <span style={{ fontSize: "18px", fontWeight: 500, color: "#737373", display: "flex" }}>
                     Personal Media Dashboard
                  </span>
               </div>
            </div>
         </div>

         {thumbUrl && (
            <div
               style={{
                  display: "flex",
                  alignItems: "center",
                  marginLeft: "48px",
               }}
            >
               <img
                  src={thumbUrl}
                  width={340}
                  height={340}
                  style={{
                     borderRadius: "16px",
                     objectFit: "cover",
                  }}
               />
            </div>
         )}
      </div>,
      { width: 1200, height: 630, format: "png" },
   );
};

export const GET = async (req: NextRequest) => {
   const page = req.nextUrl.searchParams.get("page") ?? "dashboard";
   const artistKey = req.nextUrl.searchParams.get("artist");

   if (page === "artist" && artistKey) {
      const artistOG = await getArtistOG(artistKey);
      if (artistOG) return artistOG;
   }

   const stats = await getStats();
   const name = env.DISPLAY_NAME;

   const statItems: Array<{ label: string; value: string }> = [
      { label: "Movies", value: stats.totalMovies.toLocaleString() },
      { label: "Shows", value: stats.totalShows.toLocaleString() },
   ];
   if (stats.totalArtists > 0) {
      statItems.push({ label: "Artists", value: stats.totalArtists.toLocaleString() });
   }
   statItems.push({ label: "Hours Watched", value: stats.hoursWatched.toLocaleString() });

   const pageTitle =
      page === "movies"
         ? `${name}'s Movies`
         : page === "tv"
           ? `${name}'s TV Shows`
           : page === "music"
             ? `${name}'s Music`
             : page === "analytics"
               ? `${name}'s Analytics`
               : `${name}'s Library`;

   return new ImageResponse(
      <div
         style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0a0a0a",
            color: "#e5e5e5",
            padding: "56px 72px",
            justifyContent: "space-between",
         }}
      >
         <div
            style={{
               position: "absolute",
               top: "-150px",
               right: "-80px",
               width: "500px",
               height: "500px",
               borderRadius: "50%",
               background:
                  "radial-gradient(circle, rgba(229,160,13,0.12) 0%, transparent 70%)",
               display: "flex",
            }}
         />

         <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
               style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
               }}
            >
               <svg
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  fill="none"
                  style={{ display: "flex" }}
               >
                  <path d="M12 9L24 16L12 23V9Z" fill="#e5a00d" />
               </svg>
            </div>
            <span
               style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#e5a00d",
                  display: "flex",
               }}
            >
               plexo
            </span>
         </div>

         <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <span
               style={{
                  fontSize: "64px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  display: "flex",
               }}
            >
               {pageTitle}
            </span>

            <div style={{ display: "flex", gap: "48px" }}>
               {statItems.map((item) => (
                  <div
                     key={item.label}
                     style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                     }}
                  >
                     <span
                        style={{
                           fontSize: "48px",
                           fontWeight: 800,
                           color: "#e5a00d",
                           display: "flex",
                        }}
                     >
                        {item.value}
                     </span>
                     <span
                        style={{
                           fontSize: "20px",
                           fontWeight: 500,
                           color: "#525252",
                           display: "flex",
                        }}
                     >
                        {item.label}
                     </span>
                  </div>
               ))}
            </div>
         </div>

         <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
               style={{
                  display: "flex",
                  padding: "10px 24px",
                  background: "#1a1a1a",
                  borderRadius: "100px",
                  border: "1px solid rgba(229,160,13,0.3)",
               }}
            >
               <span
                  style={{
                     fontSize: "18px",
                     fontWeight: 500,
                     color: "#737373",
                     display: "flex",
                  }}
               >
                  Personal Media Dashboard
               </span>
            </div>
         </div>
      </div>,
      {
         width: 1200,
         height: 630,
         format: "png",
      },
   );
};

export const dynamic = "force-dynamic";
