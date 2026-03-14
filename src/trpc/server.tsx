import "server-only";

import React, { cache } from "react";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";

import { createQueryClient } from "./query-client";

export const runtime = "nodejs";

const createContext = cache(async () => {
   const heads = new Headers(await headers());
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
