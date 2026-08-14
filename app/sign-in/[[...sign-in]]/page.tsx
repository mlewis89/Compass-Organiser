import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClerkSignIn from "@/components/ClerkSignIn";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return <ClerkSignIn />;
}
