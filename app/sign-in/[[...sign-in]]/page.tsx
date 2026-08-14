import type { Metadata } from "next";
import ClerkSignIn from "@/components/ClerkSignIn";

export const metadata: Metadata = {
  title: "Log in · Compass Organiser",
};

export default function SignInPage() {
  return (
    <div className="ui padded segment clerk-auth-panel">
      <ClerkSignIn />
    </div>
  );
}
