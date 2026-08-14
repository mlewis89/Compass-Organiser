import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClerkSignUp from "@/components/ClerkSignUp";

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return <ClerkSignUp />;
}
