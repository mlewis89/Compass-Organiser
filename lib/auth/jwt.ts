import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

export type JwtUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export const AuthenticationError = new GraphQLError(
  "Could not authenticate user",
  {
    extensions: { code: "UNAUTHENTICATED" },
  },
);

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

function getExpiry() {
  return process.env.JWT_EXPIRY ?? "7d";
}

export function signToken(user: JwtUser) {
  return jwt.sign({ data: user }, getSecret(), {
    expiresIn: getExpiry() as jwt.SignOptions["expiresIn"],
  });
}

export function readTokenFromRequest(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    return header.split(" ").pop()?.trim() ?? null;
  }
  return null;
}

export function verifyToken(token: string): JwtUser | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as { data: JwtUser };
    return decoded.data ?? null;
  } catch {
    return null;
  }
}

export function requireUser(user: JwtUser | null): JwtUser {
  if (!user) {
    throw AuthenticationError;
  }
  return user;
}
