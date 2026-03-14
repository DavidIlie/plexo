"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
   loggerLink,
   httpBatchStreamLink,
   createTRPCClient,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import React, { useState } from "react";
import SuperJSON from "superjson";

import { type AppRouter } from "~/server/api/root";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
   if (typeof window === "undefined") {
      return createQueryClient();
   }
   return (clientQueryClientSingleton ??= createQueryClient());
};

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const TRPCReactProvider: React.FC<{ children: React.ReactNode }> = (
   props,
) => {
   const queryClient = getQueryClient();

   const [trpcClient] = useState(() =>
      createTRPCClient<AppRouter>({
         links: [
            loggerLink({
               enabled: (op) =>
                  process.env.NODE_ENV === "development" ||
                  (op.direction === "down" && op.result instanceof Error),
            }),
            httpBatchStreamLink({
               transformer: SuperJSON,
               url: getBaseUrl() + "/api/trpc",
               headers: () => {
                  const headers = new Headers();
                  headers.set("x-trpc-source", "nextjs-react");
                  return headers;
               },
            }),
         ],
      }),
   );

   return (
      <QueryClientProvider client={queryClient}>
         <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            {props.children}
         </TRPCProvider>
      </QueryClientProvider>
   );
};

const getBaseUrl = () => {
   if (typeof window !== "undefined") return window.location.origin;
   return `http://localhost:${process.env.PORT ?? 3000}`;
};
