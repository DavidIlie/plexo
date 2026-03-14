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
      APP_URL: z.string().url().default("http://localhost:3000"),
      PLAUSIBLE_ENABLED: z
         .enum(["true", "false"])
         .default("false")
         .transform((v) => v === "true"),
      PLAUSIBLE_DOMAIN: z.string().optional(),
      PLAUSIBLE_SCRIPT_URL: z.string().optional(),
      PLAUSIBLE_API_URL: z.string().optional(),
      SHOW_DEVICES: z
         .enum(["true", "false"])
         .default("true")
         .transform((v) => v === "true"),
      SHOW_LOCATIONS: z
         .enum(["true", "false"])
         .default("false")
         .transform((v) => v === "true"),
      SHOW_MUSIC: z
         .enum(["true", "false"])
         .default("false")
         .transform((v) => v === "true"),
      RECOMMEND_ENABLED: z
         .enum(["true", "false"])
         .default("false")
         .transform((v) => v === "true"),
      TMDB_API_KEY: z.string().optional(),
      TURNSTILE_SITE_KEY: z.string().optional(),
      TURNSTILE_SECRET_KEY: z.string().optional(),
      RESEND_API_KEY: z.string().optional(),
      RESEND_FROM: z.string().optional(),
      RECOMMEND_EMAIL_TO: z.string().optional(),
      SMTP_HOST: z.string().optional(),
      SMTP_PORT: z.coerce.number().optional(),
      SMTP_USER: z.string().optional(),
      SMTP_PASS: z.string().optional(),
      SMTP_FROM: z.string().optional(),
      DISCORD_WEBHOOK_URL: z.string().url().optional(),
      OVERSEERR_URL: z.string().url().optional(),
      OVERSEERR_API_KEY: z.string().optional(),
      NODE_ENV: z
         .enum(["development", "test", "production"])
         .default("development"),
   },
   client: {},
   skipValidation: !!process.env.SKIP_ENV_VALIDATION,
   emptyStringAsUndefined: true,
   experimental__runtimeEnv: {},
});
