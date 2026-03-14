import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { plexRouter } from "./routers/plex";
import { tautulliRouter } from "./routers/tautulli";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = createTRPCRouter({
   plex: plexRouter,
   tautulli: tautulliRouter,
   analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
