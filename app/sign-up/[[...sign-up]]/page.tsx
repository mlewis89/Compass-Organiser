import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const { userId, redirectToSignUp } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return redirectToSignUp({ returnBackUrl: "/dashboard" });
}
