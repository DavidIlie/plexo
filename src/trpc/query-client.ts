import {
   defaultShouldDehydrateQuery,
   QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
   new QueryClient({
      defaultOptions: {
         queries: {
            // Server data is now cached via 'use cache: remote'; keep a short
            // client staleTime so navigations feel instant but data refreshes.
            staleTime: 60 * 1000,
            gcTime: 10 * 60 * 1000,
         },
         dehydrate: {
            serializeData: SuperJSON.serialize,
            shouldDehydrateQuery: (query) =>
               defaultShouldDehydrateQuery(query) ||
               query.state.status === "pending",
         },
         hydrate: {
            deserializeData: SuperJSON.deserialize,
         },
      },
   });
