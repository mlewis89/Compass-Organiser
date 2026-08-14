import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { membershipRoles, memberships, roles } from "@/db/schema";
import { AuthenticationError, type JwtUser } from "@/lib/auth/jwt";

export const LEADER_ROLES = [
  "GroupLeader",
  "AssistGroupLeader",
  "Leader",
  "AssistantLeader",
  "UnitLeader",
  "Secretary",
  "Treasurer",
  "Quartermaster",
] as const;

export const GROUP_ADMIN_ROLES = ["GroupLeader", "AssistGroupLeader", "Secretary"] as const;

function adminEmails(): Set<string> {
  return new Set(
    (process.env.GROUP_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Fresh Clerk sign-ups get a membership with zero roles (see lib/auth/syncUser.ts),
 * so without this bootstrap nobody could ever assign the first role. Emails listed
 * in GROUP_ADMIN_EMAILS are treated as GroupLeader until real roles are assigned.
 */
export async function getMemberRoles(
  userId: string,
  groupId: string,
  email?: string | null,
): Promise<string[]> {
  if (email && adminEmails().has(email.toLowerCase())) {
    return ["GroupLeader"];
  }
  const db = getDb();
  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)))
    .limit(1);
  if (!membership) {
    return [];
  }
  const rows = await db
    .select({ role: roles })
    .from(membershipRoles)
    .innerJoin(roles, eq(membershipRoles.roleId, roles.id))
    .where(eq(membershipRoles.membershipId, membership.id));
  return rows.map(({ role }) => role.name);
}

export function hasAnyRole(userRoles: string[], allowed: readonly string[]): boolean {
  return userRoles.some((role) => allowed.includes(role));
}

export async function requireRole(
  user: JwtUser | null,
  groupId: string | null,
  allowed: readonly string[],
): Promise<string[]> {
  if (!user || !groupId) {
    throw AuthenticationError;
  }
  const userRoles = await getMemberRoles(user._id, groupId, user.email);
  if (!hasAnyRole(userRoles, allowed)) {
    throw AuthenticationError;
  }
  return userRoles;
}

export async function requireOwnerOrRole(
  user: JwtUser | null,
  groupId: string | null,
  ownerIds: Array<string | null | undefined>,
  allowed: readonly string[],
): Promise<void> {
  if (!user || !groupId) {
    throw AuthenticationError;
  }
  if (ownerIds.includes(user._id)) {
    return;
  }
  await requireRole(user, groupId, allowed);
}
