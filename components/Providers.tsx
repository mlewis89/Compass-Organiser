"use client";

import { type ReactNode } from "react";
import ApolloProviderWithAuth from "@/components/ApolloProviderWithAuth";
import { CompassProvider } from "@/lib/client/CompassContext";
import Nav from "@/components/Nav";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProviderWithAuth>
      <CompassProvider>
        <div className="min-100-vh bg-primary ui container">
          <Nav />
          {children}
        </div>
      </CompassProvider>
    </ApolloProviderWithAuth>
  );
}
