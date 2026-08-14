"use client";

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { type ReactNode } from "react";
import { Container } from "semantic-ui-react";
import { CompassProvider } from "@/lib/client/CompassContext";
import Auth from "@/lib/client/auth";
import Nav from "@/components/Nav";

const authLink = setContext((_, { headers }) => {
  const token = Auth.getToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const httpLink = createHttpLink({
  uri: "/api/graphql",
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
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
