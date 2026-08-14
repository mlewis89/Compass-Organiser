import type { NextRequest } from "next/server";
import type { JwtUser } from "@/lib/auth/jwt";
import { syncUserFromClerk } from "@/lib/auth/syncUser";
import { groupSlugFromRequest, resolveGroupId } from "@/lib/tenancy";

export type GraphQLContext = {
  user: JwtUser | null;
  groupId: string | null;
};

export async function createContext(_req: NextRequest): Promise<GraphQLContext> {
  const user = await syncUserFromClerk();
  const slug = await groupSlugFromRequest();
  const groupId = await resolveGroupId(slug);
  return { user, groupId };
}
