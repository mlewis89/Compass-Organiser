import type { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema";

export type UserRow = InferSelectModel<typeof users>;

export function displayName(user: {
  scoutName?: string | null;
  preferredName?: string | null;
  firstName?: string | null;
}) {
  return user.scoutName || user.preferredName || user.firstName || "";
}

export function mapUser(user: UserRow) {
  return {
    ...user,
    _id: user.id,
    displayName: displayName(user),
    taskAvailability: user.taskAvailability,
    taskAvailabity: user.taskAvailability,
    section: user.section,
    Section: user.section,
    dob: user.dob ? user.dob.toISOString() : null,
    accountStatus: user.externalAuthId ? "active" : "invited",
  };
}

export function toDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && value.trim() !== "") {
    return new Date(asNumber);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dateString(value?: Date | null) {
  return value ? value.toISOString() : null;
}
