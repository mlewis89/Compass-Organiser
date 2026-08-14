"use client";

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useAuth } from "@clerk/nextjs";
import { type ReactNode, useMemo } from "react";

function createApolloClient(getToken: () => Promise<string | null>) {
  const authLink = setContext(async (_, { headers }) => {
    const token = await getToken();
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const httpLink = createHttpLink({
    uri: "/api/graphql",
    credentials: "same-origin",
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { errorPolicy: "all" },
      query: { errorPolicy: "all" },
    },
  });
}

export default function ApolloProviderWithAuth({
  children,
}: {
  children: ReactNode;
}) {
  const { getToken, isLoaded } = useAuth();
  const client = useMemo(() => createApolloClient(getToken), [getToken]);

  if (!isLoaded) {
    return (
      <div className="min-100-vh bg-primary ui container">
        <p className="ui text">Loading…</p>
      </div>
    );
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
