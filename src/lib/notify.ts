import "server-only";

import { Resend } from "resend";
import nodemailer from "nodemailer";
import { env } from "~/env";

interface RecommendationPayload {
   title: string;
   mediaType: "movie" | "tv";
   year: string;
   posterPath: string | null;
   senderName: string;
   message?: string;
}

const buildEmailHtml = (payload: RecommendationPayload): string => {
   const posterUrl = payload.posterPath
      ? `https://image.tmdb.org/t/p/w300${payload.posterPath}`
      : null;
   const typeLabel = payload.mediaType === "movie" ? "Movie" : "TV Show";

   return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #1a1a1a; color: #e5e5e5; border-radius: 12px;">
  <h2 style="margin: 0 0 16px; font-size: 20px; color: #f5f5f5;">New Recommendation</h2>
  <p style="margin: 0 0 16px; color: #a3a3a3;"><strong style="color: #f5f5f5;">${payload.senderName}</strong> recommends a ${typeLabel.toLowerCase()}:</p>
  <div style="display: flex; gap: 16px; background: #262626; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
    ${posterUrl ? `<img src="${posterUrl}" alt="${payload.title}" style="width: 80px; height: 120px; object-fit: cover; border-radius: 6px;" />` : ""}
    <div>
      <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #f5f5f5;">${payload.title}</p>
      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">${typeLabel} · ${payload.year}</p>
    </div>
  </div>
  ${payload.message ? `<div style="background: #262626; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #f59e0b;"><p style="margin: 0; font-size: 14px; color: #d4d4d4;">"${payload.message}"</p></div>` : ""}
</div>`.trim();
};

const sendViaResend = async (payload: RecommendationPayload) => {
   if (!env.RESEND_API_KEY || !env.RESEND_FROM || !env.RECOMMEND_EMAIL_TO)
      return;

   const resend = new Resend(env.RESEND_API_KEY);

   await resend.emails.send({
      from: env.RESEND_FROM,
      to: env.RECOMMEND_EMAIL_TO,
      subject: `${payload.senderName} recommends: ${payload.title}`,
      html: buildEmailHtml(payload),
   });
};

const sendViaSMTP = async (payload: RecommendationPayload) => {
   if (!env.SMTP_HOST || !env.SMTP_FROM || !env.RECOMMEND_EMAIL_TO) return;

   const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      auth:
         env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
   });

   await transport.sendMail({
      from: env.SMTP_FROM,
      to: env.RECOMMEND_EMAIL_TO,
      subject: `${payload.senderName} recommends: ${payload.title}`,
      html: buildEmailHtml(payload),
   });
};

const sendViaDiscord = async (payload: RecommendationPayload) => {
   if (!env.DISCORD_WEBHOOK_URL) return;

   const typeLabel = payload.mediaType === "movie" ? "Movie" : "TV Show";
   const posterUrl = payload.posterPath
      ? `https://image.tmdb.org/t/p/w300${payload.posterPath}`
      : undefined;

   await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         embeds: [
            {
               title: `${payload.title} (${payload.year})`,
               description: payload.message
                  ? `**${payload.senderName}** says: "${payload.message}"`
                  : `**${payload.senderName}** recommends this ${typeLabel.toLowerCase()}`,
               color: 0xf59e0b,
               thumbnail: posterUrl ? { url: posterUrl } : undefined,
               footer: { text: `${typeLabel} · via Plexo` },
            },
         ],
      }),
   });
};

export const sendRecommendation = async (
   payload: RecommendationPayload,
): Promise<void> => {
   const results = await Promise.allSettled([
      sendViaResend(payload),
      sendViaSMTP(payload),
      sendViaDiscord(payload),
   ]);

   const allFailed = results.every((r) => r.status === "rejected");
   const anyAttempted = results.some(
      (r) => r.status === "fulfilled" || r.status === "rejected",
   );

   if (allFailed && anyAttempted) {
      console.error(
         "All notification channels failed:",
         results
            .filter((r) => r.status === "rejected")
            .map((r) => (r as PromiseRejectedResult).reason),
      );
   }
};
