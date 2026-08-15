import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { groups, memberships } from "@/db/schema";
import { isPlatformAdmin } from "@/lib/authz";
import { AuthenticationError, type JwtUser } from "@/lib/auth/jwt";

export const GROUP_COOKIE = "compass_group";

export async function findGroupBySlug(slug: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(groups)
    .where(eq(groups.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function findGroupById(groupId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  return row ?? null;
}

/** Active memberships for a user, ordered by group name. */
export async function listUserActiveGroups(userId: string) {
  const db = getDb();
  return db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      status: groups.status,
      enabledModules: groups.enabledModules,
    })
    .from(memberships)
    .innerJoin(groups, eq(memberships.groupId, groups.id))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.status, "active"),
        eq(groups.status, "active"),
      ),
    )
    .orderBy(asc(groups.name));
}

export async function listActiveGroups() {
  const db = getDb();
  return db
    .select()
    .from(groups)
    .where(eq(groups.status, "active"))
    .orderBy(asc(groups.name));
}

/**
 * Resolve the active group for this request from the user's memberships
 * (and cookie), not from a global DEFAULT_GROUP_SLUG for everyone.
 */
export async function resolveGroupIdForUser(
  user: JwtUser | null,
  requestedSlug?: string | null,
): Promise<string | null> {
  if (!user) {
    return null;
  }

  const cookieSlug = requestedSlug ?? null;
  const platformAdmin = isPlatformAdmin(user.email);

  if (cookieSlug) {
    const bySlug = await findGroupBySlug(cookieSlug);
    if (bySlug && bySlug.status === "active") {
      if (platformAdmin || (await hasActiveMembership(user._id, bySlug.id))) {
        return bySlug.id;
      }
    }
  }

  if (platformAdmin) {
    const all = await listActiveGroups();
    if (all.length === 1) {
      return all[0].id;
    }
    if (cookieSlug) {
      return null;
    }
    return all[0]?.id ?? null;
  }

  const membershipsList = await listUserActiveGroups(user._id);
  if (membershipsList.length === 0) {
    return null;
  }
  return membershipsList[0].id;
}

/** @deprecated Prefer resolveGroupIdForUser — kept for public/seed fallbacks. */
export async function resolveGroupId(
  requestedSlug?: string | null,
): Promise<string | null> {
  const slug =
    requestedSlug ||
    process.env.DEFAULT_GROUP_SLUG ||
    "default";

  const bySlug = await findGroupBySlug(slug);
  if (bySlug) {
    return bySlug.id;
  }

  const db = getDb();
  const [first] = await db.select({ id: groups.id }).from(groups).limit(1);
  return first?.id ?? null;
}

export async function hasActiveMembership(
  userId: string,
  groupId: string,
): Promise<boolean> {
  const db = getDb();
  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.groupId, groupId),
        eq(memberships.status, "active"),
      ),
    )
    .limit(1);
  return Boolean(membership);
}

export async function groupSlugFromRequest(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(GROUP_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function setActiveGroupCookie(slug: string) {
  const store = await cookies();
  store.set(GROUP_COOKIE, slug, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
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

  if (isPlatformAdmin(user.email)) {
    const group = await findGroupById(groupId);
    if (!group) {
      throw AuthenticationError;
    }
    return { id: "platform-admin", userId: user._id, groupId, status: "active" };
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
