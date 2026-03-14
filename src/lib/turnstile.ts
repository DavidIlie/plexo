import "server-only";

import { env } from "~/env";

interface TurnstileResponse {
   success: boolean;
   "error-codes"?: string[];
}

export const verifyTurnstile = async (token: string): Promise<boolean> => {
   if (!env.TURNSTILE_SECRET_KEY) return true;

   const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET_KEY,
            response: token,
         }),
      },
   );

   if (!res.ok) return false;

   const data = (await res.json()) as TurnstileResponse;
   return data.success;
};
