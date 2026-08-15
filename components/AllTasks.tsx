"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { Button, Checkbox, Label, Segment } from "semantic-ui-react";
import { QUERY_UNIT_BUCKETS, QUERY_UNASSIGNED_TASKS } from "@/lib/client/queries";
import { SET_TASK_STATUS } from "@/lib/client/mutations";
import type { Task, UnitBucket } from "@/lib/client/types";
import { usePermissions } from "@/lib/client/usePermissions";
import TaskKanban from "@/components/TaskKanban";
import TaskList, { type TaskColumn } from "@/components/TaskList";
import TaskModal from "@/components/TaskModal";
import { isCompleteStatus, isWishlistStatus, TASK_STATUS } from "@/lib/taskStatus";
import { filterTaskForest, taskForestHasVisible } from "@/lib/client/taskTree";

const SHOW_EMPTY_BUCKETS_KEY = "all-tasks-show-empty-buckets";
const HIDE_WISHLIST_KEY = "all-tasks-hide-wishlist";
const HIDE_COMPLETED_KEY = "all-tasks-hide-completed";
const LEGACY_HIDE_WISHLIST_KEY = "suggested-hide-wishlist";
const VIEW_KEY = "tasks-bucket-view";
type BucketView = "list" | "kanban";

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
}: {
  tasks: Task[];
  hideWishlist: boolean;
  hideCompleted: boolean;
  onOpen: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onAddSubtask?: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return <p>No tasks in this bucket.</p>;
  }

  return (
    <TaskList
      tasks={tasks}
      columns={columns}
      hideWishlist={hideWishlist}
      hideCompleted={hideCompleted}
      mobileSummary={["status", "dueDate", "responsible"]}
      onAddSubtask={onAddSubtask}
      renderActions={(task) => (
        <Button.Group size="tiny">
          <Button onClick={() => onOpen(task._id)}>Open</Button>
          {task.status !== TASK_STATUS.complete ? (
            <Button positive onClick={() => onComplete(task._id)}>
              Complete
            </Button>
          ) : null}
        </Button.Group>
      )}
    />
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
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEmptyBuckets, setShowEmptyBuckets] = useState(false);
  const [hideWishlist, setHideWishlist] = useState(true);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [view, setView] = useState<BucketView>("list");

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
  const visibleBuckets = showEmptyBuckets
    ? buckets
    : buckets.filter((bucket) => hasVisible(bucket.tasks));
  const showUnassigned =
    canViewAll && (showEmptyBuckets || hasVisible(unassigned));
  const emptyBucketCount =
    buckets.filter((bucket) => !hasVisible(bucket.tasks)).length +
    (canViewAll && !hasVisible(unassigned) ? 1 : 0);

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

  if (loading || !data?.unitBuckets) {
    return <p>Loading</p>;
  }

  const renderBucket = (tasks: Task[]) =>
    view === "kanban" ? (
      <TaskKanban
        tasks={tasks}
        hideWishlist={hideWishlist}
        hideCompleted={hideCompleted}
        onOpen={openTask}
        onStatusChange={changeTaskStatus}
      />
    ) : (
      <TaskBucketTable
        tasks={tasks}
        hideWishlist={hideWishlist}
        hideCompleted={hideCompleted}
        onOpen={openTask}
        onComplete={(taskId) => changeTaskStatus(taskId, TASK_STATUS.complete)}
        onAddSubtask={permissions.canManageTasks ? openSubtask : undefined}
      />
    );

  return (
    <>
      <Segment padded>
        <div className="task-bucket-toolbar">
          <div className="task-bucket-toolbar-start">
            {permissions.canManageTasks ? (
              <Button primary onClick={() => openTask(null)}>
                New Task
              </Button>
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
        <Segment padded key={bucket.unit._id}>
          <Label attached="top">{bucket.unit.name}</Label>
          {renderBucket(bucket.tasks)}
        </Segment>
      ))}

      {showUnassigned ? (
        <Segment padded>
          <Label attached="top">Unassigned</Label>
          {renderBucket(unassigned)}
        </Segment>
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
    </>
  );
}
