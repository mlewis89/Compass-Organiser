"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Button } from "semantic-ui-react";
import type { Task } from "@/lib/client/types";
import { buildTaskTree, filterTaskForest, type TaskTreeNode } from "@/lib/client/taskTree";
import {
  TASK_STATUS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  columnForStatus,
  isCompleteStatus,
  isWishlistStatus,
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

function promoteStubRoots(
  nodes: TaskTreeNode[],
  visibleStatuses: ReadonlySet<TaskStatus>,
): TaskTreeNode[] {
  const result: TaskTreeNode[] = [];
  for (const node of nodes) {
    if (node.isStub && !visibleStatuses.has(columnForStatus(node.status))) {
      result.push(...promoteStubRoots(node.children, visibleStatuses));
    } else {
      result.push(node);
    }
  }
  return result;
}

function KanbanCard({
  task,
  nested = false,
  onOpen,
  onStatusChange,
  onDragEnd,
}: {
  task: TaskTreeNode;
  nested?: boolean;
  onOpen: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onDragEnd: () => void;
}) {
  if (task.isStub) {
    return (
      <article className={nested ? "task-kanban-card is-nested is-stub" : "task-kanban-card is-stub"}>
        <div className="task-kanban-card-title">{task.name || "Untitled task"}</div>
        {task.children.length > 0 ? (
          <div className="task-kanban-subtasks">
            {task.children.map((child) => (
              <KanbanCard
                key={child._id}
                task={child}
                nested
                onOpen={onOpen}
                onStatusChange={onStatusChange}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={nested ? "task-kanban-card is-nested" : "task-kanban-card"}
      draggable
      role="listitem"
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(TASK_ID_MIME, task._id);
      }}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        className="task-kanban-card-title"
        onClick={() => onOpen(task._id)}
      >
        {task.name || "Untitled task"}
      </button>
      <div className="task-kanban-card-meta">
        {nested ? `${TASK_STATUS_LABELS[columnForStatus(task.status)]} · ` : null}
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
      {task.children.length > 0 ? (
        <div className="task-kanban-subtasks">
          {task.children.map((child) => (
            <KanbanCard
              key={child._id}
              task={child}
              nested
              onOpen={onOpen}
              onStatusChange={onStatusChange}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function TaskKanban({
  tasks,
  hideWishlist = false,
  hideCompleted = false,
  onOpen,
  onStatusChange,
}: Props) {
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const statuses = useMemo(
    () =>
      TASK_STATUSES.filter((status) => {
        if (hideWishlist && status === TASK_STATUS.wishlist) {
          return false;
        }
        if (hideCompleted && status === TASK_STATUS.complete) {
          return false;
        }
        return true;
      }),
    [hideWishlist, hideCompleted],
  );

  const columns = useMemo(() => {
    const visible =
      hideWishlist || hideCompleted
        ? filterTaskForest(tasks, (task) => {
            if (hideWishlist && isWishlistStatus(task.status)) {
              return false;
            }
            if (hideCompleted && isCompleteStatus(task.status)) {
              return false;
            }
            return true;
          })
        : tasks;
    const roots = promoteStubRoots(buildTaskTree(visible), new Set(statuses));
    const grouped: Record<TaskStatus, TaskTreeNode[]> = {
      wishlist: [],
      toDo: [],
      inProgress: [],
      complete: [],
    };
    for (const task of roots) {
      grouped[columnForStatus(task.status)].push(task);
    }
    return grouped;
  }, [tasks, hideWishlist, hideCompleted, statuses]);

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
              <KanbanCard
                key={task._id}
                task={task}
                onOpen={onOpen}
                onStatusChange={onStatusChange}
                onDragEnd={() => setDropTarget(null)}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
