"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
   RefreshCw,
   Database,
   Shield,
   Gauge,
   Bell,
   Mail,
   MessageSquare,
   Check,
   Loader2,
} from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import { useTRPC } from "~/trpc/react";
import { useAppConfig } from "~/components/app-config-provider";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

interface RateLimitEntry {
   key: string;
   count: number;
   remaining: number;
   resetsIn: number;
}

interface CacheStats {
   handler: "redis" | "memory";
   roots: string[];
   rateLimits: RateLimitEntry[];
}

const NotificationTests = ({
   secret,
   turnstileSiteKey,
   adminTurnstileToken,
   onTurnstileSuccess,
}: {
   secret: string;
   turnstileSiteKey?: string;
   adminTurnstileToken?: string;
   onTurnstileSuccess: (token: string) => void;
}) => {
   const trpc = useTRPC();

   const testDiscord = useMutation(
      trpc.recommend.testNotification.mutationOptions(),
   );
   const testEmail = useMutation(
      trpc.recommend.testNotification.mutationOptions(),
   );

   const needsTurnstile = !!turnstileSiteKey && !adminTurnstileToken;

   return (
      <>
         <Separator />
         <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
               <Bell className="h-3 w-3" />
               Test notifications
            </p>

            {needsTurnstile && (
               <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                     Complete verification to test notifications
                  </p>
                  <Turnstile
                     siteKey={turnstileSiteKey!}
                     onSuccess={onTurnstileSuccess}
                  />
               </div>
            )}

            {!needsTurnstile && (
               <div className="flex gap-2">
                  <Button
                     variant="outline"
                     size="sm"
                     className="flex-1 gap-1.5"
                     disabled={testDiscord.isPending}
                     onClick={() =>
                        testDiscord.mutate({
                           channel: "discord",
                           secret,
                           turnstileToken: adminTurnstileToken,
                        })
                     }
                  >
                     {testDiscord.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                     ) : testDiscord.isSuccess ? (
                        <Check className="h-3 w-3 text-green-500" />
                     ) : (
                        <MessageSquare className="h-3 w-3" />
                     )}
                     Discord
                  </Button>
                  <Button
                     variant="outline"
                     size="sm"
                     className="flex-1 gap-1.5"
                     disabled={testEmail.isPending}
                     onClick={() =>
                        testEmail.mutate({
                           channel: "email",
                           secret,
                           turnstileToken: adminTurnstileToken,
                        })
                     }
                  >
                     {testEmail.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                     ) : testEmail.isSuccess ? (
                        <Check className="h-3 w-3 text-green-500" />
                     ) : (
                        <Mail className="h-3 w-3" />
                     )}
                     Email
                  </Button>
               </div>
            )}

            {testDiscord.error && (
               <p className="text-xs text-destructive">
                  Discord: {testDiscord.error.message}
               </p>
            )}
            {testEmail.error && (
               <p className="text-xs text-destructive">
                  Email: {testEmail.error.message}
               </p>
            )}
         </div>
      </>
   );
};

export const RefreshDialog = () => {
   const router = useRouter();
   const queryClient = useQueryClient();
   const { turnstileSiteKey } = useAppConfig();
   const [open, setOpen] = useState(false);
   const [secret, setSecret] = useState("");
   const [adminTurnstileToken, setAdminTurnstileToken] = useState<string | undefined>();
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
      setAdminTurnstileToken(undefined);
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
            router.refresh();
            await queryClient.invalidateQueries();
            setTimeout(() => setStatus("idle"), 1500);
         } else {
            setStatus("error");
            setErrorMessage("Failed to refresh");
         }
      } catch {
         setStatus("error");
         setErrorMessage("Failed to refresh");
      }
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
                           Cache backend
                        </div>
                        <p className="mt-1 text-lg font-semibold capitalize tabular-nums">
                           {cacheStats?.handler ?? "—"}
                        </p>
                     </div>
                     <div className="flex items-center justify-center">
                        <Button
                           variant="destructive"
                           size="sm"
                           onClick={handleRefresh}
                           disabled={status === "loading"}
                        >
                           {status === "loading" ? (
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                           ) : (
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                           )}
                           {status === "success" ? "Refreshed" : "Refresh all"}
                        </Button>
                     </div>
                  </div>

                  {cacheStats && cacheStats.roots.length > 0 && (
                     <div className="flex flex-wrap gap-1.5">
                        {cacheStats.roots.map((root) => (
                           <span
                              key={root}
                              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                           >
                              {root}
                           </span>
                        ))}
                     </div>
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

                  <NotificationTests
                     secret={secret}
                     turnstileSiteKey={turnstileSiteKey}
                     adminTurnstileToken={adminTurnstileToken}
                     onTurnstileSuccess={setAdminTurnstileToken}
                  />
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
};
