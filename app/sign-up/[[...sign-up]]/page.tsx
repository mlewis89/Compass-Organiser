import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up · Compass Organiser",
};

export default function SignUpPage() {
  return (
    <div className="ui padded segment clerk-auth-panel">
      <SignUp />
    </div>
  );
}
