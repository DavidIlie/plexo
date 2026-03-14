"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
   LayoutDashboard,
   Film,
   Tv,
   Music,
   BarChart3,
   Sun,
   Moon,
   Search,
   Heart,
   type LucideIcon,
} from "lucide-react";

import { cn } from "~/lib/utils";
import { useAppConfig } from "~/components/app-config-provider";
import { Button } from "~/components/ui/button";

export const Navbar = () => {
   const pathname = usePathname();
   const { theme, setTheme } = useTheme();
   const { recommendEnabled, musicEnabled } = useAppConfig();

   const navItems = useMemo(() => {
      const items: Array<{ href: string; label: string; icon: LucideIcon }> = [
         { href: "/", label: "Dashboard", icon: LayoutDashboard },
         { href: "/movies", label: "Movies", icon: Film },
         { href: "/tv", label: "TV Shows", icon: Tv },
      ];
      if (musicEnabled) {
         items.push({ href: "/music", label: "Music", icon: Music });
      }
      items.push({ href: "/analytics", label: "Analytics", icon: BarChart3 });
      return items;
   }, [musicEnabled]);

   const openSearch = () => {
      window.dispatchEvent(
         new KeyboardEvent("keydown", { key: "k" }),
      );
   };

   const openRecommend = () => {
      window.dispatchEvent(new CustomEvent("open-recommend-dialog"));
   };

   return (
      <>
         {/* Top navbar — full nav on md+, logo + actions only on mobile */}
         <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
               <div className="flex items-center">
                  <Link href="/" className="mr-6 flex items-center gap-2">
                     <Image
                        src="/icon.svg"
                        alt="Plexo"
                        width={22}
                        height={22}
                        className="rounded"
                     />
                     <span className="text-base font-semibold tracking-tight text-primary">
                        plexo
                     </span>
                  </Link>
                  <div className="hidden items-center gap-0.5 md:flex">
                     {navItems.map((item) => {
                        const isActive =
                           item.href === "/"
                              ? pathname === "/"
                              : pathname.startsWith(item.href);
                        return (
                           <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                 "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                                 isActive
                                    ? "bg-foreground/5 text-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                              )}
                           >
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                           </Link>
                        );
                     })}
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  {recommendEnabled && (
                     <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-muted-foreground"
                        onClick={openRecommend}
                     >
                        <Heart className="h-3.5 w-3.5" />
                        <span className="hidden text-xs sm:inline">Recommend</span>
                     </Button>
                  )}
                  <Button
                     variant="ghost"
                     size="sm"
                     className="h-8 gap-2 text-muted-foreground"
                     onClick={openSearch}
                  >
                     <Search className="h-3.5 w-3.5" />
                     <span className="hidden text-xs sm:inline">Search</span>
                     <kbd className="hidden rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] sm:inline">
                        K
                     </kbd>
                  </Button>
                  <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8 text-muted-foreground"
                     onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                     }
                  >
                     <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                     <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                     <span className="sr-only">Toggle theme</span>
                  </Button>
               </div>
            </div>
         </nav>

         {/* Bottom nav — mobile only */}
         <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm md:hidden">
            <div className="flex h-16 items-center justify-around px-2">
               {navItems.map((item) => {
                  const isActive =
                     item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);
                  return (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                           "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] transition-colors",
                           isActive
                              ? "text-primary"
                              : "text-muted-foreground",
                        )}
                     >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                     </Link>
                  );
               })}
            </div>
         </nav>
      </>
   );
};
