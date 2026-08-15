"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Button } from "semantic-ui-react";
import type { Task } from "@/lib/client/types";
import {
  TASK_STATUS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  columnForStatus,
  isCompleteStatus,
  type TaskStatus,
} from "@/lib/taskStatus";

type Props = {
  tasks: Task[];
  hideWishlist?: boolean;
  hideCompleted?: boolean;
  onOpen: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
};

const TASK_ID_MIME = "text/plain";

function formatDuration(value?: number | null): string {
  if (value == null) {
    return "";
  }
  return value === 1 ? "1 hr" : `${value} hrs`;
}

export default function TaskKanban({
  tasks,
  hideWishlist = false,
  hideCompleted = false,
  onOpen,
  onStatusChange,
}: Props) {
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const statuses = TASK_STATUSES.filter((status) => {
    if (hideWishlist && status === TASK_STATUS.wishlist) {
      return false;
    }
    if (hideCompleted && status === TASK_STATUS.complete) {
      return false;
    }
    return true;
  });

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      wishlist: [],
      toDo: [],
      inProgress: [],
      complete: [],
    };
    for (const task of tasks) {
      grouped[columnForStatus(task.status)].push(task);
    }
    return grouped;
  }, [tasks]);

  const handleDrop = (status: TaskStatus, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDropTarget(null);
    const taskId = event.dataTransfer.getData(TASK_ID_MIME);
    if (!taskId) {
      return;
    }
    const current = tasks.find((task) => task._id === taskId);
    if (!current || columnForStatus(current.status) === status) {
      return;
    }
    onStatusChange(taskId, status);
  };

  return (
    <div
      className={`task-kanban task-kanban-cols-${statuses.length}`}
      role="list"
    >
      {statuses.map((status) => {
        const columnTasks = columns[status];
        const isTarget = dropTarget === status;
        return (
          <section
            key={status}
            className={isTarget ? "task-kanban-column is-drop-target" : "task-kanban-column"}
            aria-label={TASK_STATUS_LABELS[status]}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dropTarget !== status) {
                setDropTarget(status);
              }
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDropTarget((current) => (current === status ? null : current));
              }
            }}
            onDrop={(event) => handleDrop(status, event)}
          >
            <header className="task-kanban-column-header">
              <span>{TASK_STATUS_LABELS[status]}</span>
              <span className="task-kanban-count">{columnTasks.length}</span>
            </header>
            {columnTasks.map((task) => (
              <article
                key={task._id}
                className="task-kanban-card"
                draggable
                role="listitem"
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData(TASK_ID_MIME, task._id);
                }}
                onDragEnd={() => setDropTarget(null)}
              >
                <button
                  type="button"
                  className="task-kanban-card-title"
                  onClick={() => onOpen(task._id)}
                >
                  {task.name || "Untitled task"}
                </button>
                <div className="task-kanban-card-meta">
                  {task.priority != null ? `Priority ${task.priority}` : null}
                  {task.priority != null && task.duration != null ? " · " : null}
                  {formatDuration(task.duration)}
                </div>
                <Button.Group size="tiny">
                  <Button type="button" onClick={() => onOpen(task._id)}>
                    Open
                  </Button>
                  {isCompleteStatus(task.status) ? null : (
                    <Button
                      type="button"
                      positive
                      onClick={() => onStatusChange(task._id, TASK_STATUS.complete)}
                    >
                      Complete
                    </Button>
                  )}
                </Button.Group>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
