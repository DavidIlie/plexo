import { ImageResponse } from "@takumi-rs/image-response";
import { type NextRequest } from "next/server";
import { env } from "~/env";
import { getCachedOrFetch, CacheTTL } from "~/lib/cache";
import { getLibrarySections, getMovies, getShows } from "~/lib/plex";
import { getHistory } from "~/lib/tautulli";

const getStats = async () => {
   const { data } = await getCachedOrFetch(
      "og:stats",
      async () => {
         const sections = await getLibrarySections();
         const movieSection = sections.find((s) => s.type === "movie");
         const showSection = sections.find((s) => s.type === "show");

         const totalMovies = movieSection
            ? (await getMovies(movieSection.key)).totalSize
            : 0;
         const totalShows = showSection
            ? (await getShows(showSection.key)).totalSize
            : 0;

         const history = await getHistory(1000);
         const hoursWatched = Math.round(
            parseInt(history.total_duration) / 3600,
         );

         return { totalMovies, totalShows, hoursWatched };
      },
      CacheTTL.ANALYTICS,
   );
   return data;
};

export const GET = async (req: NextRequest) => {
   const page = req.nextUrl.searchParams.get("page") ?? "dashboard";
   const stats = await getStats();
   const name = env.DISPLAY_NAME;

   const statItems: Array<{ label: string; value: string }> = [];

   if (page === "movies") {
      statItems.push({ label: "Movies", value: String(stats.totalMovies) });
      statItems.push({ label: "Hours Watched", value: String(stats.hoursWatched) });
   } else if (page === "tv") {
      statItems.push({ label: "TV Shows", value: String(stats.totalShows) });
      statItems.push({ label: "Hours Watched", value: String(stats.hoursWatched) });
   } else if (page === "analytics") {
      statItems.push({ label: "Movies", value: String(stats.totalMovies) });
      statItems.push({ label: "Shows", value: String(stats.totalShows) });
      statItems.push({ label: "Hours", value: String(stats.hoursWatched) });
   } else {
      statItems.push({ label: "Movies", value: String(stats.totalMovies) });
      statItems.push({ label: "Shows", value: String(stats.totalShows) });
      statItems.push({ label: "Hours Watched", value: String(stats.hoursWatched) });
   }

   const pageTitle =
      page === "movies"
         ? "Movies"
         : page === "tv"
           ? "TV Shows"
           : page === "analytics"
             ? "Analytics"
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
                  "radial-gradient(circle, rgba(100,100,120,0.15) 0%, transparent 70%)",
               display: "flex",
            }}
         />

         <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
               style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#171717",
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
                  <path d="M12 9L24 16L12 23V9Z" fill="#e5e5e5" />
               </svg>
            </div>
            <span
               style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
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
                           color: "#a3a3a3",
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
                  background: "#171717",
                  borderRadius: "100px",
                  border: "1px solid #262626",
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
