export const TASK_DRAG_MIME = "text/plain";

export function setTaskDragData(dataTransfer: DataTransfer, taskId: string) {
  dataTransfer.effectAllowed = "move";
  dataTransfer.setData(TASK_DRAG_MIME, taskId);
}

export function getTaskDragId(dataTransfer: DataTransfer): string {
  return dataTransfer.getData(TASK_DRAG_MIME).trim();
}
