import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { groups, memberships } from "@/db/schema";
import { AuthenticationError, type JwtUser } from "@/lib/auth/jwt";

export const GROUP_COOKIE = "compass_group";

export async function resolveGroupId(
  requestedSlug?: string | null,
): Promise<string | null> {
  const db = getDb();
  const slug =
    requestedSlug ||
    process.env.DEFAULT_GROUP_SLUG ||
    "default";

  const [bySlug] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.slug, slug))
    .limit(1);

  if (bySlug) {
    return bySlug.id;
  }

  const [first] = await db.select({ id: groups.id }).from(groups).limit(1);
  return first?.id ?? null;
}

export async function groupSlugFromRequest(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(GROUP_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function requireMembership(
  user: JwtUser | null,
  groupId: string | null,
) {
  if (!user) {
    throw AuthenticationError;
  }
  if (!groupId) {
    throw new Error("No active group is configured");
  }

  const db = getDb();
  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, user._id),
        eq(memberships.groupId, groupId),
        eq(memberships.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw AuthenticationError;
  }

  return membership;
}
