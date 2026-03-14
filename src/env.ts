import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
   server: {
      PLEX_URL: z.string().url(),
      PLEX_TOKEN: z.string(),
      TAUTULLI_URL: z.string().url(),
      TAUTULLI_API_KEY: z.string(),
      TAUTULLI_USER_ID: z.string().optional(),
      REFRESH_SECRET: z.string(),
      DISPLAY_NAME: z.string().default("David"),
      NODE_ENV: z
         .enum(["development", "test", "production"])
         .default("development"),
   },
   client: {},
   skipValidation: !!process.env.SKIP_ENV_VALIDATION,
   emptyStringAsUndefined: true,
   experimental__runtimeEnv: {},
});
