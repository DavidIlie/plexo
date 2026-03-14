"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Film, Tv, BarChart3 } from "lucide-react";

import { cn } from "~/lib/utils";

const navItems = [
   { href: "/", label: "Dashboard", icon: LayoutDashboard },
   { href: "/movies", label: "Movies", icon: Film },
   { href: "/tv", label: "TV Shows", icon: Tv },
   { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export const Navbar = () => {
   const pathname = usePathname();

   return (
      <nav className="border-b border-border bg-card">
         <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-1">
               <Link
                  href="/"
                  className="mr-4 text-lg font-bold text-primary"
               >
                  plexo
               </Link>
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
                           "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                           isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                     >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                     </Link>
                  );
               })}
            </div>
            <span className="text-xs text-muted-foreground/50 hidden sm:inline">
               <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">Mod+L</kbd> refresh
            </span>
         </div>
      </nav>
   );
};
