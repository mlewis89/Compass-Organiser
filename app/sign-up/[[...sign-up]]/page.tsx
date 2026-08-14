import type { Metadata } from "next";
import ClerkSignUp from "@/components/ClerkSignUp";

export const metadata: Metadata = {
  title: "Sign up · Compass Organiser",
};

export default function SignUpPage() {
  return (
    <div className="ui padded segment clerk-auth-panel">
      <ClerkSignUp />
    </div>
  );
}
