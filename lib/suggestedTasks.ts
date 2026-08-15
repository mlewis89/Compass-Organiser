import { interpretedPriority, isCompleteStatus } from "@/lib/taskStatus";

/**
 * Suggested Tasks eligibility and ranking.
 *
 * Original opt-in list (skill overlap + time-available count), with unit
 * buckets as a visibility fence — not a third matching pool.
 *
 * Eligible when all of:
 * 1. Incomplete
 * 2. Not taken (nobody claimed, nobody named responsible)
 * 3. Skill: zero required skills (matches everyone) OR any overlap with
 *    the user's selected skills — applied when building the candidate pool
 * 4. Unit visibility: no units, or the user belongs to one of the task's
 *    units, or the user can view all unit buckets
 *
 * Rank: skill-matched before unskilled, then sooner due date, then higher
 * interpreted priority. Wishlist parks a task: its stored priority still
 * orders it among other wishlist items, but every open task outranks it
 * when skill match and due date are otherwise equal.
 * Cap is Time Available as a count; 0 means none.
 */

export type SuggestedTaskCandidate = {
  id: string;
  status?: string | null;
  dueDate?: Date | string | null;
  priority?: number | null;
};

export type SuggestedTaskPickInput<T extends SuggestedTaskCandidate> = {
  candidates: T[];
  skillMatchedIds: Set<string>;
  takenIds: Set<string>;
  unitIdsByTask: Map<string, string[]>;
  userUnitIds: Set<string>;
  viewAll: boolean;
  limit: number;
};

export function isSuggestedUnitVisible(
  taskUnitIds: string[],
  userUnitIds: Set<string>,
  viewAll: boolean,
): boolean {
  if (viewAll || taskUnitIds.length === 0) {
    return true;
  }
  return taskUnitIds.some((unitId) => userUnitIds.has(unitId));
}

function dueTime(dueDate: Date | string | null | undefined): number {
  if (!dueDate) {
    return Number.POSITIVE_INFINITY;
  }
  const time = dueDate instanceof Date ? dueDate.getTime() : Date.parse(dueDate);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function compareSuggestedTasks(
  a: SuggestedTaskCandidate,
  b: SuggestedTaskCandidate,
  skillMatchedIds: Set<string>,
): number {
  const aMatched = skillMatchedIds.has(a.id) ? 0 : 1;
  const bMatched = skillMatchedIds.has(b.id) ? 0 : 1;
  if (aMatched !== bMatched) {
    return aMatched - bMatched;
  }
  const aDue = dueTime(a.dueDate);
  const bDue = dueTime(b.dueDate);
  if (aDue !== bDue) {
    return aDue - bDue;
  }
  return interpretedPriority(b) - interpretedPriority(a);
}

export function pickSuggestedTasks<T extends SuggestedTaskCandidate>(
  input: SuggestedTaskPickInput<T>,
): T[] {
  if (input.limit <= 0) {
    return [];
  }
  const eligible = input.candidates.filter((task) => {
    if (isCompleteStatus(task.status)) {
      return false;
    }
    if (input.takenIds.has(task.id)) {
      return false;
    }
    return isSuggestedUnitVisible(
      input.unitIdsByTask.get(task.id) ?? [],
      input.userUnitIds,
      input.viewAll,
    );
  });
  eligible.sort((a, b) => compareSuggestedTasks(a, b, input.skillMatchedIds));
  return eligible.slice(0, input.limit);
}
