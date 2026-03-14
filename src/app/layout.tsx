import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme-provider";
import { Navbar } from "~/components/navbar";

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
   themeColor: "#e5a539",
   width: "device-width",
   initialScale: 1,
};

export const metadata: Metadata = {
   title: {
      template: "%s | Plexo",
      default: "Plexo - Personal Media Dashboard",
   },
   description: "Personal media dashboard for Plex",
   icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const RootLayout = ({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) => {
   return (
      <html lang="en" suppressHydrationWarning>
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            suppressHydrationWarning
         >
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
               <TRPCReactProvider>
                  <Navbar />
                  <main className="mx-auto max-w-7xl px-4 py-6">
                     {children}
                  </main>
               </TRPCReactProvider>
            </ThemeProvider>
         </body>
      </html>
   );
};
export default RootLayout;
