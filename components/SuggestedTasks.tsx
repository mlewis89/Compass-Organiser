"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { Button, Label, Segment } from "semantic-ui-react";
import {
  QUERY_SUGGESTED_TASKS,
  QUERY_UNIT_BUCKETS,
  QUERY_UNASSIGNED_TASKS,
} from "@/lib/client/queries";
import { ASSIGN_USER_TASK } from "@/lib/client/mutations";
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
  { key: "duration", label: "Duration" },
  { key: "requiredSkills", label: "Required skills" },
  { key: "status", label: "Status" },
];

export default function SuggestedTasks() {
  const [state, dispatch] = useCompassContext();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { permissions } = usePermissions();
  const mySkills = state.skills.filter((skill) => skill.isActiveForUser);
  const querySkills = mySkills.map((skill) => ({
    _id: skill._id,
    name: skill.name,
  }));

  const { data, refetch } = useQuery<{ suggestedTasks: Task[] }>(QUERY_SUGGESTED_TASKS, {
    variables: {
      numberOfTasks: state.TimeAvailable || 0,
      userSkills: querySkills,
    },
  });
  const [assignUserTask] = useMutation(ASSIGN_USER_TASK, {
    refetchQueries: [{ query: QUERY_UNIT_BUCKETS }, { query: QUERY_UNASSIGNED_TASKS }],
  });
  const tasks = data?.suggestedTasks ?? [];

  const claimTask = (task: Task) => {
    void assignUserTask({ variables: { taskId: task._id } }).then(() => {
      dispatch({ type: UPDATE_RERENDER_MYTASKS, payload: true });
      void refetch();
    });
  };

  return (
    <>
      <Segment padded>
        <Label attached="top">Suggested Tasks</Label>
        <TaskList
          tasks={tasks}
          columns={columns}
          nest={false}
          showParentLabel
          mobileSummary={["duration", "status"]}
          onOpen={(task) => {
            setParentTask(null);
            setActiveTask(task._id);
            setShowTaskModal(true);
          }}
          statusExtraAction={(task) => (
            <Button
              basic
              size="mini"
              compact
              type="button"
              onClick={() => claimTask(task)}
            >
              Claim Task
            </Button>
          )}
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
