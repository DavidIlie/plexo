import "server-only";

import React, { cache } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";

import { createQueryClient } from "./query-client";

// RSC context for the `caller`/`trpc` proxies used during server render.
// It deliberately does NOT read headers(): RSC only issues read queries (which
// don't depend on request headers), and reading headers() here would force
// every page that touches caller to render dynamically — defeating the static
// App Shell under Cache Components. Request-scoped headers (x-forwarded-for for
// rate limiting, etc.) are read in the HTTP tRPC route's own context.
const createContext = cache(async () => {
   const heads = new Headers();
   heads.set("x-trpc-source", "rsc");

   return createTRPCContext({
      headers: heads,
   });
});

const getQueryClient = cache(createQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
   router: appRouter,
   ctx: createContext,
   queryClient: getQueryClient,
});

export const caller = appRouter.createCaller(createContext);

export const HydrateClient: React.FC<{ children: React.ReactNode }> = (
   props,
) => {
   const queryClient = getQueryClient();
   return (
      <HydrationBoundary state={dehydrate(queryClient)}>
         {props.children}
      </HydrationBoundary>
   );
};

export { getQueryClient };
