function decodePublishableKeyFrontendHost(publishableKey: string): string {
  const payload = publishableKey.split("_").slice(2).join("_");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf-8").replace(/\$$/, "");
}

export function getClerkAccountPortalOrigin(): string {
  const configured = process.env.CLERK_ACCOUNT_PORTAL_ORIGIN;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
  }

  const frontendHost = decodePublishableKeyFrontendHost(publishableKey);
  const match = frontendHost.match(/^([^.]+)\.clerk\.accounts\.dev$/);
  if (!match) {
    throw new Error(
      "Clerk publishable key is not a development instance key. Use pk_test_* keys that decode to *.clerk.accounts.dev on *.vercel.app deployments.",
    );
  }

  return `https://${match[1]}.accounts.dev`;
}

export function clerkAccountPortalUrl(
  path: "sign-in" | "sign-up",
  redirectUrl: string,
): string {
  const origin = getClerkAccountPortalOrigin();
  const url = new URL(`/${path}`, origin);
  url.searchParams.set("redirect_url", redirectUrl);
  return url.toString();
}

export async function getRequestOrigin(headersList: Headers): Promise<string> {
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
