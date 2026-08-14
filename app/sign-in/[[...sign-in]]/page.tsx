import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { userId, redirectToSignIn } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return redirectToSignIn({ returnBackUrl: "/dashboard" });
}
