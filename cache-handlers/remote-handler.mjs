// @ts-check
import { createRedisRemoteHandler } from "./redis-impl.mjs";

// This module is only `require.resolve`'d by next.config.ts when the cache
// driver is "redis" AND REDIS_URL is set, so the URL is guaranteed present
// here. There is no fallback import of Next internals: when Redis is not
// selected the config never references this file and Next uses its built-in
// in-memory LRU for `use cache: remote`.
const handler = createRedisRemoteHandler(
   /** @type {string} */ (process.env.REDIS_URL),
);

export default handler;
