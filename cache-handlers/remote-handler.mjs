// @ts-check
import { createRedisRemoteHandler } from "./redis-impl.mjs";
import { createMemoryHandler } from "./memory-impl.mjs";

// Backend is chosen at RUNTIME (this module is loaded by the Next server, and in
// standalone mode next.config is frozen at build time — so the toggle must live
// here, not in the config). Set CACHE_DRIVER=redis + REDIS_URL to use Redis;
// otherwise fall back to the in-memory handler. Both impls are statically
// imported so `redis` is always traced into the standalone output and the
// backend can be flipped purely via environment on a prebuilt image.
const useRedis =
   process.env.CACHE_DRIVER === "redis" && Boolean(process.env.REDIS_URL);

const handler = useRedis
   ? createRedisRemoteHandler(/** @type {string} */ (process.env.REDIS_URL))
   : createMemoryHandler();

export default handler;
