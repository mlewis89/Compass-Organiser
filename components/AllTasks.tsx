"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import {
  Button,
  Label,
  Segment,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import { QUERY_TASKS } from "@/lib/client/queries";
import { SET_TASK_STATUS } from "@/lib/client/mutations";
import type { Task } from "@/lib/client/types";
import { usePermissions } from "@/lib/client/usePermissions";
import TaskModal from "@/components/TaskModal";

const headers = [
  "name",
  "description",
  "priority",
  "dueDate",
  "duration",
  "requiredSkills",
  "responsible",
  "units",
  "status",
] as const;

function formatCell(task: Task, key: (typeof headers)[number]) {
  switch (key) {
    case "requiredSkills":
      return (task.requiredSkills ?? []).map((skill) => skill.name).join(", ");
    case "responsible":
      return (task.responsible ?? [])
        .map((person) => person.displayName)
        .filter(Boolean)
        .join(", ");
    case "units":
      return (task.units ?? [])
        .map((unit) => unit.name)
        .filter(Boolean)
        .join(", ");
    case "dueDate":
      return task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "";
    default:
      return String(task[key] ?? "");
  }
}

export default function AllTasks() {
  const { data, loading, refetch } = useQuery<{ tasks: Task[] }>(QUERY_TASKS);
  const { permissions } = usePermissions();
  const [setTaskStatus] = useMutation(SET_TASK_STATUS, {
    refetchQueries: [{ query: QUERY_TASKS }],
  });
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  if (loading || !data?.tasks) {
    return <p>Loading</p>;
  }

  return (
    <>
      <Segment padded>
        <Label attached="top">All Tasks</Label>
        {permissions.canManageTasks ? (
          <Button
            primary
            style={{ marginBottom: "1em" }}
            onClick={() => {
              setActiveTask(null);
              setShowTaskModal(true);
            }}
          >
            New Task
          </Button>
        ) : null}
        <Table celled selectable>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHeaderCell key={header}>{header}</TableHeaderCell>
              ))}
              <TableHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.tasks.map((task) => (
              <TableRow key={task._id}>
                {headers.map((propertyName) => (
                  <TableCell key={task._id + propertyName}>
                    {formatCell(task, propertyName)}
                  </TableCell>
                ))}
                <TableCell>
                  <Button.Group size="tiny">
                    <Button
                      onClick={() => {
                        setActiveTask(task._id);
                        setShowTaskModal(true);
                      }}
                    >
                      Open
                    </Button>
                    {task.status !== "complete" ? (
                      <Button
                        positive
                        onClick={() =>
                          void setTaskStatus({
                            variables: { taskId: task._id, status: "complete" },
                          })
                        }
                      >
                        Complete
                      </Button>
                    ) : null}
                  </Button.Group>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Segment>
      {showTaskModal ? (
        <TaskModal
          activeTask={activeTask}
          showTaskModal={showTaskModal}
          setShowTaskModal={setShowTaskModal}
          onSaved={() => void refetch()}
        />
      ) : null}
    </>
  );
}
