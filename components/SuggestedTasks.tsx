"use client";

import { useMutation, useQuery } from "@apollo/client";
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

  return (
    <Segment padded>
      <Label attached="top">Suggested Tasks</Label>
      <TaskList
        tasks={tasks}
        columns={columns}
        nest={false}
        showParentLabel
        mobileSummary={["duration", "status"]}
        renderActions={(task) => (
          <Button
            size="tiny"
            onClick={() => {
              void assignUserTask({ variables: { taskId: task._id } }).then(() => {
                dispatch({ type: UPDATE_RERENDER_MYTASKS, payload: true });
                void refetch();
              });
            }}
          >
            Add Task
          </Button>
        )}
      />
    </Segment>
  );
}
