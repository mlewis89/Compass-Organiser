"use client";

import { SignUp } from "@clerk/nextjs";

export default function ClerkSignUp() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/dashboard"
      fallback={<p>Loading sign up…</p>}
    />
  );
}
