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
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
         <div className="mx-auto flex h-12 max-w-7xl items-center px-4">
            <Link href="/" className="mr-6 text-base font-semibold tracking-tight">
               plexo
            </Link>
            <div className="flex items-center gap-0.5">
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
                           "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                           isActive
                              ? "bg-foreground/5 text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                        )}
                     >
                        <item.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{item.label}</span>
                     </Link>
                  );
               })}
            </div>
         </div>
      </nav>
   );
};
