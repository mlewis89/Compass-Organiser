import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clerkAccountPortalUrl,
  getRequestOrigin,
} from "@/lib/auth/clerkPortal";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  const origin = await getRequestOrigin(await headers());
  redirect(
    clerkAccountPortalUrl("sign-in", `${origin}/dashboard`),
  );
}
