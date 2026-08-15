import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { getDb } from "@/lib/db";
import { groups, membershipRoles, memberships, roles } from "@/db/schema";
import { AuthenticationError, type JwtUser } from "@/lib/auth/jwt";
import {
  expandEnabledModules,
  isModuleEnabled,
  type ModuleKey,
} from "@/lib/groupModules";

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

/** Group Leader and Assistant Group Leader (not Secretary) — see every unit bucket. */
export const UNIT_BUCKET_ADMIN_ROLES = ["GroupLeader", "AssistGroupLeader"] as const;

export { MODULE_SETTINGS_ROLES } from "@/lib/groupModules";

function adminEmails(): Set<string> {
  return new Set(
    (process.env.GROUP_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Platform admins (GROUP_ADMIN_EMAILS) — group CRUD, orphans, cross-group assign. */
export function isPlatformAdmin(email?: string | null): boolean {
  if (!email) {
    return false;
  }
  return adminEmails().has(email.toLowerCase());
}

export function requirePlatformAdmin(user: JwtUser | null): JwtUser {
  if (!user || !isPlatformAdmin(user.email)) {
    throw AuthenticationError;
  }
  return user;
}

/**
 * Fresh Clerk sign-ups may have no group roles yet, so without this bootstrap
 * nobody could assign the first in-group role. Emails listed in GROUP_ADMIN_EMAILS
 * are also treated as GroupLeader inside a group context.
 */
export async function getMemberRoles(
  userId: string,
  groupId: string,
  email?: string | null,
): Promise<string[]> {
  if (isPlatformAdmin(email)) {
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

export async function canViewAllUnitBuckets(
  user: JwtUser | null,
  groupId: string | null,
): Promise<boolean> {
  if (!user) {
    return false;
  }
  if (isPlatformAdmin(user.email)) {
    return true;
  }
  if (!groupId) {
    return false;
  }
  const userRoles = await getMemberRoles(user._id, groupId, user.email);
  return hasAnyRole(userRoles, UNIT_BUCKET_ADMIN_ROLES);
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

export async function getGroupEnabledModules(groupId: string) {
  const db = getDb();
  const [row] = await db
    .select({ enabledModules: groups.enabledModules })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  return expandEnabledModules(row?.enabledModules);
}

/** Reject when a group module is disabled. Use for authenticated mutations/queries. */
export async function requireModule(
  groupId: string | null,
  module: ModuleKey,
): Promise<void> {
  if (!groupId) {
    throw AuthenticationError;
  }
  const modules = await getGroupEnabledModules(groupId);
  if (!isModuleEnabled(modules, module)) {
    throw new GraphQLError(`The ${module} module is disabled for this group`, {
      extensions: { code: "MODULE_DISABLED", module },
    });
  }
}
