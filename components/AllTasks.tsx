"use client";

import { useQuery } from "@apollo/client";
import {
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
import type { Task } from "@/lib/client/types";

const headers = [
  "name",
  "description",
  "priority",
  "dueDate",
  "duration",
  "requiredSkills",
  "responsible",
  "status",
] as const;

function formatCell(task: Task, key: (typeof headers)[number]) {
  switch (key) {
    case "requiredSkills":
      return (task.requiredSkills ?? []).map((skill) => skill.name).join(", ");
    case "responsible":
      return task.responsible?.displayName ?? "";
    case "dueDate":
      return task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "";
    default:
      return String(task[key] ?? "");
  }
}

export default function AllTasks() {
  const { data, loading } = useQuery<{ tasks: Task[] }>(QUERY_TASKS);

  if (loading || !data) {
    return <p>Loading</p>;
  }

  return (
    <Segment padded>
      <Label attached="top">All Tasks</Label>
      <Table celled selectable>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHeaderCell key={header}>{header}</TableHeaderCell>
            ))}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Segment>
  );
}
