"use client";

import { SignUp } from "@clerk/nextjs";

export default function ClerkSignUp() {
  return (
    <div className="clerk-auth-panel ui padded segment">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
        signInForceRedirectUrl="/dashboard"
      />
    </div>
  );
}
