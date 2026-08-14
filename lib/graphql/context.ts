import type { NextRequest } from "next/server";
import {
  readTokenFromRequest,
  verifyToken,
  type JwtUser,
} from "@/lib/auth/jwt";
import { groupSlugFromRequest, resolveGroupId } from "@/lib/tenancy";

export type GraphQLContext = {
  user: JwtUser | null;
  groupId: string | null;
};

export async function createContext(req: NextRequest): Promise<GraphQLContext> {
  const token = readTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  const slug = await groupSlugFromRequest();
  const groupId = await resolveGroupId(slug);
  return { user, groupId };
}
