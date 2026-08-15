"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState, type DragEvent, type ReactNode } from "react";
import { Button, Checkbox, Label, Segment } from "semantic-ui-react";
import { QUERY_UNIT_BUCKETS, QUERY_UNASSIGNED_TASKS } from "@/lib/client/queries";
import { SET_TASK_STATUS, SET_TASK_UNITS } from "@/lib/client/mutations";
import type { Task, UnitBucket } from "@/lib/client/types";
import { usePermissions } from "@/lib/client/usePermissions";
import TaskKanban from "@/components/TaskKanban";
import TaskList, { type TaskColumn } from "@/components/TaskList";
import BulkTaskModal from "@/components/BulkTaskModal";
import TaskModal from "@/components/TaskModal";
import { isCompleteStatus, isWishlistStatus, TASK_STATUS } from "@/lib/taskStatus";
import { filterTaskForest, taskForestHasVisible } from "@/lib/client/taskTree";
import { getTaskDragId } from "@/lib/client/taskDrag";

const SHOW_EMPTY_BUCKETS_KEY = "all-tasks-show-empty-buckets";
const HIDE_WISHLIST_KEY = "all-tasks-hide-wishlist";
const HIDE_COMPLETED_KEY = "all-tasks-hide-completed";
const LEGACY_HIDE_WISHLIST_KEY = "suggested-hide-wishlist";
const VIEW_KEY = "tasks-bucket-view";
type BucketView = "list" | "kanban";
const UNASSIGNED_KEY = "__unassigned__";

function bucketKey(unitId: string | null): string {
  return unitId ?? UNASSIGNED_KEY;
}

function taskBelongsToBucket(task: Task, unitId: string | null): boolean {
  const ids = (task.units ?? []).map((unit) => unit._id);
  if (unitId == null) {
    return ids.length === 0;
  }
  return ids.includes(unitId);
}

function findTaskInBuckets(
  taskId: string,
  buckets: UnitBucket[],
  unassigned: Task[],
): Task | undefined {
  for (const bucket of buckets) {
    const found = bucket.tasks.find((task) => task._id === taskId);
    if (found) {
      return found;
    }
  }
  return unassigned.find((task) => task._id === taskId);
}

const columns: TaskColumn[] = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "priority", label: "Priority" },
  { key: "dueDate", label: "Due date" },
  { key: "duration", label: "Duration" },
  { key: "requiredSkills", label: "Required skills" },
  { key: "responsible", label: "Responsible" },
  { key: "status", label: "Status" },
];

function TaskBucketTable({
  tasks,
  hideWishlist,
  hideCompleted,
  onOpen,
  onComplete,
  onAddSubtask,
  dropHint,
  canDrag,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop,
}: {
  tasks: Task[];
  hideWishlist: boolean;
  hideCompleted: boolean;
  onOpen: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onAddSubtask?: (task: Task) => void;
  dropHint?: boolean;
  canDrag?: boolean;
  onTaskDragStart?: (taskId: string) => void;
  onTaskDragEnd?: () => void;
  onTaskDrop?: (taskId: string) => void;
}) {
  if (tasks.length === 0) {
    return <p>{dropHint ? "Drop a task here." : "No tasks in this bucket."}</p>;
  }

  return (
    <TaskList
      tasks={tasks}
      columns={columns}
      hideWishlist={hideWishlist}
      hideCompleted={hideCompleted}
      mobileSummary={["status", "dueDate", "responsible"]}
      onOpen={(task) => onOpen(task._id)}
      onComplete={(task) => onComplete(task._id)}
      onAddSubtask={onAddSubtask}
      canDrag={canDrag}
      onTaskDragStart={onTaskDragStart}
      onTaskDragEnd={onTaskDragEnd}
      onTaskDrop={onTaskDrop}
    />
  );
}

function TaskBucketSection({
  label,
  unitId,
  dropActive,
  canDrop,
  onDragOverBucket,
  onDragLeaveBucket,
  onDropTask,
  children,
}: {
  label: string;
  unitId: string | null;
  dropActive: boolean;
  canDrop: boolean;
  onDragOverBucket: (unitId: string | null) => void;
  onDragLeaveBucket: (unitId: string | null) => void;
  onDropTask: (unitId: string | null, event: DragEvent<HTMLElement>) => void;
  children: ReactNode;
}) {
  return (
    <Segment
      padded
      className={dropActive ? "task-bucket is-drop-target" : "task-bucket"}
      onDragOver={
        canDrop
          ? (event: DragEvent<HTMLElement>) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              onDragOverBucket(unitId);
            }
          : undefined
      }
      onDragLeave={
        canDrop
          ? (event: DragEvent<HTMLElement>) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                onDragLeaveBucket(unitId);
              }
            }
          : undefined
      }
      onDrop={
        canDrop
          ? (event: DragEvent<HTMLElement>) => {
              event.preventDefault();
              onDropTask(unitId, event);
            }
          : undefined
      }
    >
      <Label attached="top">{label}</Label>
      {children}
    </Segment>
  );
}

export default function AllTasks() {
  const { permissions } = usePermissions();
  const canViewAll = Boolean(permissions.canViewAllUnitBuckets);
  const { data, loading, refetch } = useQuery<{ unitBuckets: UnitBucket[] }>(
    QUERY_UNIT_BUCKETS,
  );
  const { data: unassignedData, refetch: refetchUnassigned } = useQuery<{
    unassignedTasks: Task[];
  }>(QUERY_UNASSIGNED_TASKS, { skip: !canViewAll });
  const [setTaskStatus] = useMutation(SET_TASK_STATUS);
  const [setTaskUnits] = useMutation(SET_TASK_UNITS);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEmptyBuckets, setShowEmptyBuckets] = useState(false);
  const [hideWishlist, setHideWishlist] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [view, setView] = useState<BucketView>("list");
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropBucketId, setDropBucketId] = useState<string | null>(null);

  const canMoveBuckets = Boolean(permissions.canManageTasks);
  const isDragging = dragTaskId != null;
  const buckets = data?.unitBuckets ?? [];
  const unassigned = unassignedData?.unassignedTasks ?? [];
  const bucketVisible = (tasks: Task[]) =>
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
  const hasVisible = (tasks: Task[]) => taskForestHasVisible(bucketVisible(tasks));
  const visibleBuckets =
    showEmptyBuckets || isDragging
      ? buckets
      : buckets.filter((bucket) => hasVisible(bucket.tasks));
  const showUnassigned =
    canViewAll && (showEmptyBuckets || isDragging || hasVisible(unassigned));
  const emptyBucketCount =
    buckets.filter((bucket) => !hasVisible(bucket.tasks)).length +
    (canViewAll && !hasVisible(unassigned) ? 1 : 0);
  const dragTask = dragTaskId
    ? findTaskInBuckets(dragTaskId, buckets, unassigned)
    : undefined;

  useEffect(() => {
    const storedEmpty = window.localStorage.getItem(SHOW_EMPTY_BUCKETS_KEY);
    if (storedEmpty === "true") {
      setShowEmptyBuckets(true);
    }
    const storedHide =
      window.localStorage.getItem(HIDE_WISHLIST_KEY) ??
      window.localStorage.getItem(LEGACY_HIDE_WISHLIST_KEY);
    if (storedHide === "false") {
      setHideWishlist(false);
    }
    const storedCompleted = window.localStorage.getItem(HIDE_COMPLETED_KEY);
    if (storedCompleted === "false") {
      setHideCompleted(false);
    }
    const storedView = window.localStorage.getItem(VIEW_KEY);
    if (storedView === "list" || storedView === "kanban") {
      setView(storedView);
    }
  }, []);

  const persistShowEmptyBuckets = (next: boolean) => {
    setShowEmptyBuckets(next);
    window.localStorage.setItem(SHOW_EMPTY_BUCKETS_KEY, String(next));
  };

  const persistHideWishlist = (next: boolean) => {
    setHideWishlist(next);
    window.localStorage.setItem(HIDE_WISHLIST_KEY, String(next));
  };

  const persistHideCompleted = (next: boolean) => {
    setHideCompleted(next);
    window.localStorage.setItem(HIDE_COMPLETED_KEY, String(next));
  };

  const persistView = (next: BucketView) => {
    setView(next);
    window.localStorage.setItem(VIEW_KEY, next);
  };

  const refresh = () => {
    void refetch();
    if (canViewAll) {
      void refetchUnassigned();
    }
  };

  const openTask = (taskId: string | null) => {
    setParentTask(null);
    setActiveTask(taskId);
    setShowTaskModal(true);
  };

  const openSubtask = (task: Task) => {
    setActiveTask(null);
    setParentTask(task);
    setShowTaskModal(true);
  };

  const changeTaskStatus = (taskId: string, status: string) => {
    void setTaskStatus({ variables: { taskId, status } }).then(() => refresh());
  };

  const clearDrag = () => {
    setDragTaskId(null);
    setDropBucketId(null);
  };

  const moveTaskToBucket = (taskId: string, unitId: string | null, status?: string) => {
    const task = findTaskInBuckets(taskId, buckets, unassigned);
    if (!task) {
      return;
    }
    const ops: Promise<unknown>[] = [];
    if (!taskBelongsToBucket(task, unitId)) {
      ops.push(
        setTaskUnits({
          variables: { taskId, unitIds: unitId ? [unitId] : [] },
        }),
      );
    }
    if (status && task.status !== status) {
      ops.push(setTaskStatus({ variables: { taskId, status } }));
    }
    if (ops.length === 0) {
      return;
    }
    void Promise.all(ops).then(() => refresh());
  };

  const handleBucketDrop = (unitId: string | null, event: DragEvent<HTMLElement>) => {
    setDropBucketId(null);
    const taskId = getTaskDragId(event.dataTransfer);
    if (!taskId) {
      return;
    }
    moveTaskToBucket(taskId, unitId);
  };

  if (loading || !data?.unitBuckets) {
    return <p>Loading</p>;
  }

  const renderBucket = (tasks: Task[], unitId: string | null) =>
    view === "kanban" ? (
      <TaskKanban
        tasks={tasks}
        hideWishlist={hideWishlist}
        hideCompleted={hideCompleted}
        onOpen={openTask}
        onStatusChange={changeTaskStatus}
        onMoveToBucket={
          canMoveBuckets
            ? (taskId, status) => moveTaskToBucket(taskId, unitId, status)
            : undefined
        }
        onTaskDragStart={canMoveBuckets ? setDragTaskId : undefined}
        onTaskDragEnd={clearDrag}
      />
    ) : (
      <TaskBucketTable
        tasks={tasks}
        hideWishlist={hideWishlist}
        hideCompleted={hideCompleted}
        onOpen={openTask}
        onComplete={(taskId) => changeTaskStatus(taskId, TASK_STATUS.complete)}
        onAddSubtask={permissions.canManageTasks ? openSubtask : undefined}
        dropHint={isDragging}
        canDrag={canMoveBuckets}
        onTaskDragStart={setDragTaskId}
        onTaskDragEnd={clearDrag}
        onTaskDrop={(taskId) => moveTaskToBucket(taskId, unitId)}
      />
    );

  return (
    <>
      <Segment padded>
        <div className="task-bucket-toolbar">
          <div className="task-bucket-toolbar-start">
            {permissions.canManageTasks ? (
              <>
                <Button primary onClick={() => openTask(null)}>
                  New Task
                </Button>
                <Button type="button" onClick={() => setShowBulkModal(true)}>
                  Bulk create
                </Button>
              </>
            ) : null}
            <Checkbox
              toggle
              label="Hide wishlist items"
              checked={hideWishlist}
              onChange={(_event, checkbox) =>
                persistHideWishlist(Boolean(checkbox.checked))
              }
            />
            <Checkbox
              toggle
              label="Hide completed"
              checked={hideCompleted}
              onChange={(_event, checkbox) =>
                persistHideCompleted(Boolean(checkbox.checked))
              }
            />
            {emptyBucketCount > 0 || showEmptyBuckets ? (
              <Checkbox
                toggle
                label="Show empty buckets"
                checked={showEmptyBuckets}
                onChange={(_event, checkbox) =>
                  persistShowEmptyBuckets(Boolean(checkbox.checked))
                }
              />
            ) : null}
          </div>
          <Button.Group size="tiny">
            <Button
              type="button"
              active={view === "list"}
              onClick={() => persistView("list")}
            >
              List
            </Button>
            <Button
              type="button"
              active={view === "kanban"}
              onClick={() => persistView("kanban")}
            >
              Kanban
            </Button>
          </Button.Group>
        </div>
      </Segment>

      {buckets.length === 0 && !canViewAll ? (
        <Segment padded>
          <Label attached="top">Unit tasks</Label>
          <p>You are not in any units yet, so there is no unit task bucket to show.</p>
        </Segment>
      ) : null}

      {visibleBuckets.map((bucket) => (
        <TaskBucketSection
          key={bucket.unit._id}
          label={bucket.unit.name}
          unitId={bucket.unit._id}
          dropActive={
            dropBucketId === bucketKey(bucket.unit._id) &&
            Boolean(dragTask && !taskBelongsToBucket(dragTask, bucket.unit._id))
          }
          canDrop={canMoveBuckets}
          onDragOverBucket={(unitId) => setDropBucketId(bucketKey(unitId))}
          onDragLeaveBucket={(unitId) =>
            setDropBucketId((current) => (current === bucketKey(unitId) ? null : current))
          }
          onDropTask={handleBucketDrop}
        >
          {renderBucket(bucket.tasks, bucket.unit._id)}
        </TaskBucketSection>
      ))}

      {showUnassigned ? (
        <TaskBucketSection
          label="Unassigned"
          unitId={null}
          dropActive={
            dropBucketId === UNASSIGNED_KEY &&
            Boolean(dragTask && !taskBelongsToBucket(dragTask, null))
          }
          canDrop={canMoveBuckets}
          onDragOverBucket={(unitId) => setDropBucketId(bucketKey(unitId))}
          onDragLeaveBucket={(unitId) =>
            setDropBucketId((current) => (current === bucketKey(unitId) ? null : current))
          }
          onDropTask={handleBucketDrop}
        >
          {renderBucket(unassigned, null)}
        </TaskBucketSection>
      ) : null}

      {showTaskModal ? (
        <TaskModal
          activeTask={activeTask}
          parentTask={parentTask}
          showTaskModal={showTaskModal}
          setShowTaskModal={setShowTaskModal}
          onSaved={refresh}
          onCreateSubtask={
            permissions.canManageTasks
              ? (parent) => {
                  setActiveTask(null);
                  setParentTask(parent);
                }
              : undefined
          }
        />
      ) : null}

      {showBulkModal ? (
        <BulkTaskModal
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSaved={refresh}
        />
      ) : null}
    </>
  );
}
