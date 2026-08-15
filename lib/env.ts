/**
 * Resolve the app's own base URL for building absolute links (e.g. Clerk
 * invitation redirect URLs) outside of a request context.
 *
 * Set `NEXT_PUBLIC_APP_URL` explicitly in production. Falls back to Vercel's
 * auto-provided `VERCEL_URL` on preview/production deploys, then localhost
 * for local dev.
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  return "http://localhost:3000";
}
