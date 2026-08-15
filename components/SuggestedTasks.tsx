"use client";

import { useMutation, useQuery } from "@apollo/client";
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
import { QUERY_SUGGESTED_TASKS } from "@/lib/client/queries";
import { ASSIGN_USER_TASK } from "@/lib/client/mutations";
import { useCompassContext } from "@/lib/client/CompassContext";
import { UPDATE_RERENDER_MYTASKS } from "@/lib/client/actions";
import type { Task } from "@/lib/client/types";

const headers = ["name", "description", "priority", "duration"] as const;

export default function SuggestedTasks() {
  const [state, dispatch] = useCompassContext();
  const mySkills = state.skills.filter((skill) => skill.isActiveForUser);
  const querySkills = mySkills.map((skill) => ({
    _id: skill._id,
    name: skill.name,
  }));

  const { data } = useQuery<{ suggestedTasks: Task[] }>(QUERY_SUGGESTED_TASKS, {
    variables: {
      numberOfTasks: state.TimeAvailable || 0,
      userSkills: querySkills,
    },
  });
  const [assignUserTask] = useMutation(ASSIGN_USER_TASK);
  const tasks = data?.suggestedTasks ?? [];

  return (
    <Segment padded>
      <Label attached="top">Suggested Tasks</Label>
      <Table celled selectable>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHeaderCell key={header}>{header}</TableHeaderCell>
            ))}
            <TableHeaderCell>required skills</TableHeaderCell>
            <TableHeaderCell />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task._id}>
              {headers.map((propertyName) => (
                <TableCell key={task._id + propertyName}>
                  {String(task[propertyName] ?? "")}
                </TableCell>
              ))}
              <TableCell>
                {(task.requiredSkills ?? [])
                  .map((skill) => skill.name)
                  .filter(Boolean)
                  .join(", ") || "—"}
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => {
                    void assignUserTask({ variables: { taskId: task._id } });
                    dispatch({ type: UPDATE_RERENDER_MYTASKS, payload: true });
                  }}
                >
                  Add Task
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Segment>
  );
}
