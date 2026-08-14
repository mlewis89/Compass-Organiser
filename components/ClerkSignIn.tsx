"use client";

import { SignIn } from "@clerk/nextjs";

export default function ClerkSignIn() {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/dashboard"
      fallback={<p>Loading sign in…</p>}
    />
  );
}
