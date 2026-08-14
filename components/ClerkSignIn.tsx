"use client";

import { SignIn } from "@clerk/nextjs";

export default function ClerkSignIn() {
  return (
    <div className="clerk-auth-panel ui padded segment">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </div>
  );
}
