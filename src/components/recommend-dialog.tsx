"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Film, Tv, X, Check, Loader2, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { usePlausible } from "next-plausible";
import { Turnstile } from "@marsidev/react-turnstile";

import { useTRPC } from "~/trpc/react";
import { env } from "~/env";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useDebounce } from "~/hooks/use-debounce";
import type { TmdbSearchResult } from "~/types/tmdb";

type Phase = "search" | "form" | "success" | "rate-limited";

export const RecommendDialog = () => {
   const trpc = useTRPC();
   const plausible = usePlausible();
   const [open, setOpen] = useState(false);
   const [phase, setPhase] = useState<Phase>("search");
   const [query, setQuery] = useState("");
   const [selected, setSelected] = useState<TmdbSearchResult | null>(null);
   const [senderName, setSenderName] = useState("");
   const [message, setMessage] = useState("");
   const [turnstileToken, setTurnstileToken] = useState<string | undefined>();

   const debouncedQuery = useDebounce(query, 300);

   const turnstileSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

   const reset = useCallback(() => {
      setPhase("search");
      setQuery("");
      setSelected(null);
      setSenderName("");
      setMessage("");
      setTurnstileToken(undefined);
   }, []);

   useEffect(() => {
      const handler = (e: Event) => {
         if (e.type === "open-recommend-dialog") {
            setOpen(true);
         }
      };
      window.addEventListener("open-recommend-dialog", handler);
      return () => window.removeEventListener("open-recommend-dialog", handler);
   }, []);

   const { data: searchResults, isFetching: isSearching } = useQuery({
      ...trpc.recommend.search.queryOptions({ query: debouncedQuery }),
      enabled: open && phase === "search" && debouncedQuery.length > 0,
   });

   const submitMutation = useMutation(
      trpc.recommend.submit.mutationOptions({
         onSuccess: () => {
            setPhase("success");
            plausible("Recommendation");
            setTimeout(() => {
               setOpen(false);
            }, 2000);
         },
         onError: (error) => {
            if (
               error.data?.code === "TOO_MANY_REQUESTS" &&
               turnstileSiteKey
            ) {
               setPhase("rate-limited");
            }
         },
      }),
   );

   const resetRateLimitMutation = useMutation(
      trpc.recommend.resetRateLimit.mutationOptions({
         onSuccess: () => {
            setPhase("form");
            submitMutation.reset();
         },
      }),
   );

   const handleSelect = (item: TmdbSearchResult) => {
      setSelected(item);
      setPhase("form");
   };

   const handleSubmit = () => {
      if (!selected || !senderName.trim()) return;

      const title = selected.title ?? selected.name ?? "Unknown";
      const year =
         (selected.release_date ?? selected.first_air_date)?.slice(0, 4) ?? "";

      submitMutation.mutate({
         tmdbId: selected.id,
         title,
         mediaType: selected.media_type,
         year,
         posterPath: selected.poster_path,
         senderName: senderName.trim(),
         message: message.trim() || undefined,
         turnstileToken,
      });
   };

   const getTitle = (item: TmdbSearchResult) =>
      item.title ?? item.name ?? "Unknown";
   const getYear = (item: TmdbSearchResult) =>
      (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? "";

   return (
      <Dialog
         open={open}
         onOpenChange={(v) => {
            setOpen(v);
            if (!v) reset();
         }}
      >
         <DialogContent className="max-h-[80vh] overflow-hidden p-0 outline-none sm:max-w-md">
            <DialogHeader className="sr-only">
               <DialogTitle>Recommend something</DialogTitle>
            </DialogHeader>

            {phase === "search" && (
               <>
                  <div className="flex items-center border-b border-border px-4">
                     <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                     <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a movie or TV show..."
                        className="border-0 shadow-none outline-none focus-visible:ring-0 focus-visible:outline-none"
                        autoFocus
                     />
                     {query && (
                        <button
                           onClick={() => setQuery("")}
                           className="text-muted-foreground hover:text-foreground"
                        >
                           <X className="h-3.5 w-3.5" />
                        </button>
                     )}
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto px-2 py-1">
                     {isSearching && (
                        <div className="flex items-center justify-center py-8">
                           <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                     )}

                     {!isSearching &&
                        debouncedQuery &&
                        searchResults?.data.length === 0 && (
                           <p className="py-8 text-center text-sm text-muted-foreground">
                              No results
                           </p>
                        )}

                     {!isSearching && !debouncedQuery && (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                           Search TMDB for a movie or TV show to recommend
                        </p>
                     )}

                     {searchResults?.data.map((item) => (
                        <button
                           key={`${item.media_type}-${item.id}`}
                           onClick={() => handleSelect(item)}
                           className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                        >
                           {item.poster_path ? (
                              <Image
                                 src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                 alt={getTitle(item)}
                                 width={32}
                                 height={48}
                                 className="shrink-0 rounded object-cover"
                              />
                           ) : (
                              <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-muted">
                                 {item.media_type === "movie" ? (
                                    <Film className="h-3.5 w-3.5 text-muted-foreground" />
                                 ) : (
                                    <Tv className="h-3.5 w-3.5 text-muted-foreground" />
                                 )}
                              </div>
                           )}
                           <div className="min-w-0 flex-1">
                              <p className="truncate text-sm">
                                 {getTitle(item)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                 {getYear(item)}
                              </p>
                           </div>
                           <Badge
                              variant="secondary"
                              className="shrink-0 text-[10px]"
                           >
                              {item.media_type === "movie" ? "Movie" : "TV"}
                           </Badge>
                        </button>
                     ))}
                  </div>
               </>
            )}

            {phase === "form" && selected && (
               <div className="space-y-4 p-4 pt-2">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                     {selected.poster_path ? (
                        <Image
                           src={`https://image.tmdb.org/t/p/w92${selected.poster_path}`}
                           alt={getTitle(selected)}
                           width={40}
                           height={60}
                           className="shrink-0 rounded object-cover"
                        />
                     ) : (
                        <div className="flex h-[60px] w-10 shrink-0 items-center justify-center rounded bg-muted">
                           {selected.media_type === "movie" ? (
                              <Film className="h-4 w-4 text-muted-foreground" />
                           ) : (
                              <Tv className="h-4 w-4 text-muted-foreground" />
                           )}
                        </div>
                     )}
                     <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                           {getTitle(selected)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                           {selected.media_type === "movie" ? "Movie" : "TV"}{" "}
                           · {getYear(selected)}
                        </p>
                     </div>
                     <button
                        onClick={() => {
                           setSelected(null);
                           setPhase("search");
                        }}
                        className="text-muted-foreground hover:text-foreground"
                     >
                        <X className="h-4 w-4" />
                     </button>
                  </div>

                  <div className="space-y-3">
                     <div>
                        <label
                           htmlFor="sender-name"
                           className="mb-1 block text-xs text-muted-foreground"
                        >
                           Your name
                        </label>
                        <Input
                           id="sender-name"
                           value={senderName}
                           onChange={(e) => setSenderName(e.target.value)}
                           placeholder="Enter your name"
                           maxLength={100}
                           autoFocus
                        />
                     </div>

                     <div>
                        <label
                           htmlFor="message"
                           className="mb-1 block text-xs text-muted-foreground"
                        >
                           Message{" "}
                           <span className="text-muted-foreground/60">
                              (optional)
                           </span>
                        </label>
                        <Textarea
                           id="message"
                           value={message}
                           onChange={(e) => setMessage(e.target.value)}
                           placeholder="Why should I watch this?"
                           maxLength={500}
                           rows={3}
                        />
                     </div>

                     {turnstileSiteKey && (
                        <Turnstile
                           siteKey={turnstileSiteKey}
                           onSuccess={setTurnstileToken}
                        />
                     )}

                     {submitMutation.error && (
                        <p className="text-sm text-destructive">
                           {submitMutation.error.message}
                        </p>
                     )}

                     <Button
                        onClick={handleSubmit}
                        disabled={
                           !senderName.trim() ||
                           submitMutation.isPending ||
                           (!!turnstileSiteKey && !turnstileToken)
                        }
                        className="w-full"
                     >
                        {submitMutation.isPending ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Send Recommendation
                     </Button>
                  </div>
               </div>
            )}

            {phase === "rate-limited" && turnstileSiteKey && (
               <div className="flex flex-col items-center justify-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                     <ShieldAlert className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="text-center">
                     <p className="text-sm font-medium">
                        Rate limit reached
                     </p>
                     <p className="mt-1 text-xs text-muted-foreground">
                        Verify you&apos;re not a bot to continue
                     </p>
                  </div>
                  <Turnstile
                     siteKey={turnstileSiteKey}
                     onSuccess={(token) => {
                        resetRateLimitMutation.mutate({
                           turnstileToken: token,
                        });
                     }}
                  />
                  {resetRateLimitMutation.error && (
                     <p className="text-sm text-destructive">
                        {resetRateLimitMutation.error.message}
                     </p>
                  )}
                  {resetRateLimitMutation.isPending && (
                     <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
               </div>
            )}

            {phase === "success" && (
               <div className="flex flex-col items-center justify-center gap-3 p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                     <Check className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-lg font-medium">Thanks!</p>
                  <p className="text-sm text-muted-foreground">
                     Your recommendation has been sent.
                  </p>
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
};
