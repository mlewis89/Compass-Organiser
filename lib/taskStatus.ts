export const TASK_STATUS = {
  wishlist: "wishlist",
  toDo: "toDo",
  inProgress: "inProgress",
  complete: "complete",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_STATUSES = [
  TASK_STATUS.wishlist,
  TASK_STATUS.toDo,
  TASK_STATUS.inProgress,
  TASK_STATUS.complete,
] as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  wishlist: "Wishlist",
  toDo: "To Do",
  inProgress: "In Progress",
  complete: "Complete",
};

export const TASK_STATUS_OPTIONS = TASK_STATUSES.map((value) => ({
  key: value,
  text: TASK_STATUS_LABELS[value],
  value,
}));

export function isTaskStatus(value: string | null | undefined): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function isWishlistStatus(status?: string | null): boolean {
  return status === TASK_STATUS.wishlist;
}

export function isCompleteStatus(status?: string | null): boolean {
  return status === TASK_STATUS.complete;
}

/** Open pool work — excludes completed and parked wishlist items. */
export function isTaskOpen(task: { status?: string | null }): boolean {
  return !isCompleteStatus(task.status) && !isWishlistStatus(task.status);
}

export function columnForStatus(status?: string | null): TaskStatus {
  return isTaskStatus(status) ? status : TASK_STATUS.toDo;
}
