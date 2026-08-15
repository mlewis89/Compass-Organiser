"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { Label, Segment } from "semantic-ui-react";
import { QUERY_ME_TASKS } from "@/lib/client/queries";
import { SET_TASK_STATUS } from "@/lib/client/mutations";
import { useCompassContext } from "@/lib/client/CompassContext";
import { UPDATE_RERENDER_MYTASKS } from "@/lib/client/actions";
import type { Task } from "@/lib/client/types";
import TaskList, { type TaskColumn } from "@/components/TaskList";
import TaskModal from "@/components/TaskModal";
import { usePermissions } from "@/lib/client/usePermissions";

const columns: TaskColumn[] = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "priority", label: "Priority" },
  { key: "dueDate", label: "Due date" },
  { key: "duration", label: "Duration" },
  { key: "status", label: "Status" },
];

export default function MyTasks() {
  const [state, dispatch] = useCompassContext();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { permissions } = usePermissions();
  const { data, refetch } = useQuery<{ me: { myTasks: Task[] } }>(QUERY_ME_TASKS);
  const [setTaskStatus] = useMutation(SET_TASK_STATUS);

  useEffect(() => {
    if (state.reRenderMyTasks) {
      void refetch();
      dispatch({ type: UPDATE_RERENDER_MYTASKS, payload: false });
    }
  }, [state.reRenderMyTasks, refetch, dispatch]);

  const tasks = data?.me?.myTasks ?? [];

  return (
    <>
      <Segment padded>
        <Label attached="top">My Tasks</Label>
        <TaskList
          tasks={tasks}
          columns={columns}
          mobileSummary={["status", "dueDate"]}
          onOpen={(task) => {
            setParentTask(null);
            setActiveTask(task._id);
            setShowTaskModal(true);
          }}
          onComplete={(task) => {
            void setTaskStatus({
              variables: { taskId: task._id, status: "complete" },
            }).then(() => refetch());
          }}
          onAddSubtask={
            permissions.canManageTasks
              ? (task) => {
                  setActiveTask(null);
                  setParentTask(task);
                  setShowTaskModal(true);
                }
              : undefined
          }
        />
      </Segment>
      {showTaskModal ? (
        <TaskModal
          activeTask={activeTask}
          parentTask={parentTask}
          showTaskModal={showTaskModal}
          setShowTaskModal={setShowTaskModal}
          onSaved={() => void refetch()}
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
