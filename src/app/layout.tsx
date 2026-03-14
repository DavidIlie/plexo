import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme-provider";
import { Navbar } from "~/components/navbar";
import { Footer } from "~/components/footer";
import { RefreshDialog } from "~/components/refresh-dialog";
import { SearchDialog } from "~/components/search-dialog";
import { RecommendDialog } from "~/components/recommend-dialog";

const geistSans = Geist({
   variable: "--font-geist-sans",
   subsets: ["latin"],
});

const geistMono = Geist_Mono({
   variable: "--font-geist-mono",
   subsets: ["latin"],
});

export const viewport: Viewport = {
   colorScheme: "dark light",
   themeColor: "#171717",
   width: "device-width",
   initialScale: 1,
};

export const metadata: Metadata = {
   title: {
      template: "%s | Plexo",
      default: "Plexo - Personal Media Dashboard",
   },
   description: "Personal media dashboard for Plex",
   icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
   metadataBase: new URL(env.APP_URL ?? "http://localhost:3000"),
};

const RootLayout = ({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) => {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            {env.PLAUSIBLE_ENABLED && env.PLAUSIBLE_DOMAIN && (
               <PlausibleProvider
                  domain={env.PLAUSIBLE_DOMAIN}
                  selfHosted={!!env.PLAUSIBLE_SCRIPT_URL}
                  scriptProps={{
                     src: env.PLAUSIBLE_SCRIPT_URL ?? "/js/script.js",
                     ...(env.PLAUSIBLE_API_URL
                        ? { "data-api": env.PLAUSIBLE_API_URL }
                        : {}),
                  }}
               />
            )}
         </head>
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            suppressHydrationWarning
         >
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
               <NuqsAdapter>
                  <TRPCReactProvider>
                     <Navbar />
                     <main className="mx-auto max-w-7xl px-4 py-6">
                        {children}
                     </main>
                     <Footer />
                     <SearchDialog />
                     <RefreshDialog />
                     <RecommendDialog />
                  </TRPCReactProvider>
               </NuqsAdapter>
            </ThemeProvider>
         </body>
      </html>
   );
};
export default RootLayout;
