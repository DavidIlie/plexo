"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Database, Clock, Trash2, Shield, Gauge } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

interface CacheEntry {
   key: string;
   fetchedAt: string;
   expiresAt: string;
   expired: boolean;
}

interface RateLimitEntry {
   key: string;
   count: number;
   remaining: number;
   resetsIn: number;
}

interface CacheStats {
   totalEntries: number;
   activeEntries: number;
   entries: CacheEntry[];
   rateLimits: RateLimitEntry[];
}

export const RefreshDialog = () => {
   const [open, setOpen] = useState(false);
   const [secret, setSecret] = useState("");
   const [authenticated, setAuthenticated] = useState(false);
   const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
   const [errorMessage, setErrorMessage] = useState("");
   const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
   const inputRef = useRef<HTMLInputElement>(null);

   const reset = useCallback(() => {
      setSecret("");
      setAuthenticated(false);
      setStatus("idle");
      setErrorMessage("");
      setCacheStats(null);
   }, []);

   useEffect(() => {
      const handler = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key === "l") {
            e.preventDefault();
            setOpen(true);
            reset();
         }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
   }, [reset]);

   useEffect(() => {
      if (open && !authenticated) {
         setTimeout(() => inputRef.current?.focus(), 0);
      }
   }, [open, authenticated]);

   const fetchStats = async (token: string) => {
      const res = await fetch("/api/refresh", {
         headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
         const data = (await res.json()) as CacheStats;
         setCacheStats(data);
      }
   };

   const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!secret.trim()) return;

      setStatus("loading");
      try {
         const res = await fetch("/api/refresh", {
            headers: { Authorization: `Bearer ${secret}` },
         });
         if (!res.ok) {
            setStatus("error");
            setErrorMessage("Invalid secret");
            return;
         }
         setAuthenticated(true);
         setStatus("idle");
         const data = (await res.json()) as CacheStats;
         setCacheStats(data);
      } catch {
         setStatus("error");
         setErrorMessage("Network error");
      }
   };

   const handleRefresh = async () => {
      setStatus("loading");
      try {
         const res = await fetch("/api/refresh", {
            method: "POST",
            headers: { Authorization: `Bearer ${secret}` },
         });
         if (res.ok) {
            setStatus("success");
            setCacheStats({ totalEntries: 0, activeEntries: 0, entries: [], rateLimits: [] });
            setTimeout(() => window.location.reload(), 800);
         }
      } catch {
         setStatus("error");
         setErrorMessage("Failed to refresh");
      }
   };

   const tierFromKey = (key: string) => {
      if (key.startsWith("plex:sections") || key.startsWith("plex:genres")) return "LIBRARY";
      if (key.startsWith("analytics:")) return "ANALYTICS";
      if (key.startsWith("plex:onDeck") || key.startsWith("tautulli:history") || key.startsWith("tautulli:homeStats")) return "ACTIVITY";
      return "METADATA";
   };

   return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
         <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Admin
               </DialogTitle>
            </DialogHeader>

            {!authenticated ? (
               <form onSubmit={handleAuth} className="space-y-3">
                  <Input
                     ref={inputRef}
                     type="password"
                     placeholder="Enter admin secret"
                     value={secret}
                     onChange={(e) => setSecret(e.target.value)}
                     disabled={status === "loading"}
                     autoComplete="off"
                  />
                  {status === "error" && (
                     <p className="text-xs text-destructive">{errorMessage}</p>
                  )}
                  <Button type="submit" size="sm" className="w-full" disabled={!secret.trim() || status === "loading"}>
                     Authenticate
                  </Button>
               </form>
            ) : (
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                     <div className="rounded-md border border-border/50 p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                           <Database className="h-3 w-3" />
                           Cached
                        </div>
                        <p className="mt-1 text-lg font-semibold tabular-nums">
                           {cacheStats?.activeEntries ?? 0}
                           <span className="text-sm font-normal text-muted-foreground">
                              /{cacheStats?.totalEntries ?? 0}
                           </span>
                        </p>
                     </div>
                     <div className="flex items-center justify-center">
                        <Button
                           variant="destructive"
                           size="sm"
                           onClick={handleRefresh}
                           disabled={status === "loading" || status === "success"}
                        >
                           {status === "loading" ? (
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                           ) : (
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                           )}
                           {status === "success" ? "Cleared" : "Purge All"}
                        </Button>
                     </div>
                  </div>

                  {cacheStats && cacheStats.entries.length > 0 && (
                     <>
                        <Separator />
                        <div className="space-y-1.5">
                           <p className="text-xs font-medium text-muted-foreground">
                              Cache entries
                           </p>
                           {cacheStats.entries.map((entry) => (
                              <div
                                 key={entry.key}
                                 className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-1.5"
                              >
                                 <div className="min-w-0 flex-1">
                                    <p className="truncate font-mono text-xs">
                                       {entry.key}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                       <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                                          {tierFromKey(entry.key)}
                                       </span>
                                       <Clock className="h-2.5 w-2.5" />
                                       {formatDistanceToNow(new Date(entry.fetchedAt), { addSuffix: true })}
                                    </div>
                                 </div>
                                 {entry.expired && (
                                    <span className="ml-2 shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
                                       expired
                                    </span>
                                 )}
                              </div>
                           ))}
                        </div>
                     </>
                  )}

                  {cacheStats && cacheStats.entries.length === 0 && (
                     <p className="py-4 text-center text-sm text-muted-foreground">
                        Cache is empty
                     </p>
                  )}

                  {cacheStats &&
                     cacheStats.rateLimits &&
                     cacheStats.rateLimits.length > 0 && (
                        <>
                           <Separator />
                           <div className="space-y-1.5">
                              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                 <Gauge className="h-3 w-3" />
                                 Active rate limits
                              </p>
                              {cacheStats.rateLimits.map((rl) => (
                                 <div
                                    key={rl.key}
                                    className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-1.5"
                                 >
                                    <span className="font-mono text-xs">
                                       {rl.key}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                       <span className="tabular-nums">
                                          {rl.count}/120
                                       </span>
                                       <span className="tabular-nums">
                                          {rl.resetsIn}s
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </>
                     )}
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
};
