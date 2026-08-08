import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
   name: "Plexo",
   short_name: "Plexo",
   description: "Personal media dashboard for Plex",
   start_url: "/",
   display: "standalone",
   background_color: "#0a0a0a",
   theme_color: "#0a0a0a",
   icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
   ],
});
export default manifest;
