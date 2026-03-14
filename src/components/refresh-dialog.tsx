"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export const RefreshDialog = () => {
   const [open, setOpen] = useState(false);
   const [secret, setSecret] = useState("");
   const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
   const [errorMessage, setErrorMessage] = useState("");
   const inputRef = useRef<HTMLInputElement>(null);

   const reset = useCallback(() => {
      setSecret("");
      setStatus("idle");
      setErrorMessage("");
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
      if (open) {
         setTimeout(() => inputRef.current?.focus(), 0);
      }
   }, [open]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!secret.trim()) return;

      setStatus("loading");
      setErrorMessage("");

      try {
         const res = await fetch("/api/refresh", {
            method: "POST",
            headers: { Authorization: `Bearer ${secret}` },
         });

         if (!res.ok) {
            setStatus("error");
            setErrorMessage(res.status === 401 ? "Invalid secret" : `Error: ${res.status}`);
            return;
         }

         setStatus("success");
         setTimeout(() => {
            setOpen(false);
            window.location.reload();
         }, 500);
      } catch {
         setStatus("error");
         setErrorMessage("Network error");
      }
   };

   return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Refresh Cache
               </DialogTitle>
               <DialogDescription>
                  Enter the refresh secret to invalidate all cached data.
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
               <Input
                  ref={inputRef}
                  type="password"
                  placeholder="Refresh secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  disabled={status === "loading" || status === "success"}
                  autoComplete="off"
               />
               {status === "error" && (
                  <p className="text-sm text-destructive">{errorMessage}</p>
               )}
               {status === "success" && (
                  <p className="text-sm text-green-500">Cache cleared, reloading...</p>
               )}
               <div className="flex justify-end gap-2">
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => setOpen(false)}
                     disabled={status === "loading"}
                  >
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     disabled={!secret.trim() || status === "loading" || status === "success"}
                  >
                     {status === "loading" ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                     ) : null}
                     Refresh
                  </Button>
               </div>
            </form>
            <p className="text-xs text-muted-foreground">
               Shortcut: <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">Mod+L</kbd>
            </p>
         </DialogContent>
      </Dialog>
   );
};
