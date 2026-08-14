import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { typeDefs } from "@/lib/graphql/typeDefs";
import { resolvers } from "@/lib/graphql/resolvers";
import { createContext } from "@/lib/graphql/context";

export const dynamic = "force-dynamic";

const server = new ApolloServer<object>({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => createContext(req),
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
