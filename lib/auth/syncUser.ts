import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import type { JwtUser } from "@/lib/auth/jwt";

function toAppUser(row: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}): JwtUser {
  return {
    _id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
  };
}

export async function syncUserFromClerk(): Promise<JwtUser | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const db = getDb();
    const [byExternal] = await db
      .select()
      .from(users)
      .where(eq(users.externalAuthId, userId))
      .limit(1);
    if (byExternal) {
      return toAppUser(byExternal);
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return null;
    }

    const firstName = clerkUser.firstName?.trim() || "Member";
    const lastName = clerkUser.lastName?.trim() || "User";
    const normalizedEmail = email.toLowerCase();

    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (byEmail) {
      const [updated] = await db
        .update(users)
        .set({
          externalAuthId: userId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, byEmail.id))
        .returning();
      return toAppUser(updated ?? byEmail);
    }

    // Self-signups are orphans until a platform admin assigns them or they
    // accept an invite (invite path creates membership separately).
    const [created] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        externalAuthId: userId,
        firstName,
        lastName,
        passwordHash: null,
      })
      .returning();

    return toAppUser(created);
  } catch (error) {
    console.error("syncUserFromClerk failed:", error);
    return null;
  }
}
