// @ts-check
import { createRedisRemoteHandler } from "./redis-impl.mjs";
import { createMemoryHandler } from "./memory-impl.mjs";

const useRedis =
   process.env.CACHE_DRIVER === "redis" && Boolean(process.env.REDIS_URL);

const handler = useRedis
   ? createRedisRemoteHandler(/** @type {string} */ (process.env.REDIS_URL))
   : createMemoryHandler();

export default handler;
