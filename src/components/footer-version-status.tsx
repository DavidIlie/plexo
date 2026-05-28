"use client";

import { useEffect, useState } from "react";

const GITHUB_LATEST_COMMIT_URL =
   "https://api.github.com/repos/davidilie/plexo/commits/master";
const CACHE_KEY = "plexo:latest-commit";
const CACHE_TTL_MS = 15 * 60 * 1000;

type LatestCommitCache = {
   sha: string;
   checkedAt: number;
};

type VersionState = "checking" | "latest" | "outdated" | "unknown";

const readCachedSha = () => {
   try {
      const raw = window.localStorage.getItem(CACHE_KEY);

      if (!raw) {
         return undefined;
      }

      const cached = JSON.parse(raw) as LatestCommitCache;

      if (
         typeof cached.sha !== "string" ||
         typeof cached.checkedAt !== "number" ||
         Date.now() - cached.checkedAt > CACHE_TTL_MS
      ) {
         return undefined;
      }

      return cached.sha;
   } catch {
      return undefined;
   }
};

const writeCachedSha = (sha: string) => {
   try {
      window.localStorage.setItem(
         CACHE_KEY,
         JSON.stringify({ sha, checkedAt: Date.now() } satisfies LatestCommitCache),
      );
   } catch {
      // Ignore storage failures; the live check still works.
   }
};

const compareVersion = (currentVersion: string, latestSha: string): VersionState => {
   if (latestSha.startsWith(currentVersion)) {
      return "latest";
   }

   return "outdated";
};

export const FooterVersionStatus = ({
   currentVersion,
}: {
   currentVersion: string;
}) => {
   const [state, setState] = useState<VersionState>(
      currentVersion === "dev" ? "unknown" : "checking",
   );

   useEffect(() => {
      if (currentVersion === "dev") {
         setState("unknown");
         return;
      }

      const cachedSha = readCachedSha();

      if (cachedSha) {
         setState(compareVersion(currentVersion, cachedSha));
         return;
      }

      const controller = new AbortController();

      void fetch(GITHUB_LATEST_COMMIT_URL, {
         signal: controller.signal,
         headers: {
            Accept: "application/vnd.github+json",
         },
      })
         .then((response) => {
            if (!response.ok) {
               throw new Error("Failed to fetch latest commit");
            }

            return response.json() as Promise<{ sha?: unknown }>;
         })
         .then((data) => {
            if (typeof data.sha !== "string") {
               setState("unknown");
               return;
            }

            writeCachedSha(data.sha);
            setState(compareVersion(currentVersion, data.sha));
         })
         .catch((error: unknown) => {
            if (error instanceof DOMException && error.name === "AbortError") {
               return;
            }

            setState("unknown");
         });

      return () => {
         controller.abort();
      };
   }, [currentVersion]);

   if (state === "unknown") {
      return null;
   }

   return (
      <span
         className={
            state === "latest"
               ? "text-emerald-500"
               : state === "outdated"
                 ? "text-amber-500"
                 : "text-muted-foreground"
         }
         title="Compared with the latest GitHub commit on master"
      >
         {state}
      </span>
   );
};
