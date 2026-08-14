"use client";

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";
import { type ReactNode } from "react";
import { Container } from "semantic-ui-react";
import { CompassProvider } from "@/lib/client/CompassContext";
import Nav from "@/components/Nav";

const httpLink = createHttpLink({
  uri: "/api/graphql",
  credentials: "same-origin",
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: "all" },
    query: { errorPolicy: "all" },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <CompassProvider>
        <div className="min-100-vh bg-primary">
          <Container>
            <Nav />
            {children}
          </Container>
        </div>
      </CompassProvider>
    </ApolloProvider>
  );
}
