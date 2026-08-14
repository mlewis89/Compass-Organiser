import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in · Compass Organiser",
};

export default function SignInPage() {
  return (
    <div className="ui padded segment clerk-auth-panel">
      <SignIn />
    </div>
  );
}
