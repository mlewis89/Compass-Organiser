"use client";

import { useState, type ReactNode } from "react";
import {
  Icon,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import type { SemanticCOLORS } from "semantic-ui-react";
import type { Task } from "@/lib/client/types";

export type TaskColumnKey =
  | "name"
  | "description"
  | "priority"
  | "dueDate"
  | "duration"
  | "requiredSkills"
  | "responsible"
  | "status";

export type TaskColumn = {
  key: TaskColumnKey;
  label: string;
};

export type MobileSummaryField = "status" | "dueDate" | "responsible" | "duration";

type TaskListProps = {
  tasks: Task[];
  columns: readonly TaskColumn[];
  mobileSummary?: readonly MobileSummaryField[];
  renderActions?: (task: Task) => ReactNode;
};

type StatusMeta = {
  text: string;
  color: SemanticCOLORS;
};

function formatDueDate(value?: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString();
}

function formatDuration(value?: number | null): string {
  if (value == null) {
    return "";
  }
  return value === 1 ? "1 hr" : `${value} hrs`;
}

function formatSkills(task: Task): string {
  return (task.requiredSkills ?? [])
    .map((skill) => skill.name)
    .filter(Boolean)
    .join(", ");
}

function formatResponsible(task: Task): string {
  return (task.responsible ?? [])
    .map((person) => person.displayName)
    .filter(Boolean)
    .join(", ");
}

function formatStatus(status?: string | null): StatusMeta | null {
  if (!status) {
    return null;
  }
  switch (status) {
    case "complete":
      return { text: "Complete", color: "green" };
    case "inProgress":
      return { text: "In progress", color: "blue" };
    case "toDo":
      return { text: "To do", color: "grey" };
    case "wishlist":
      return { text: "Wishlist", color: "yellow" };
    default:
      return { text: status, color: "grey" };
  }
}

function StatusLabel({ status }: { status?: string | null }) {
  const meta = formatStatus(status);
  if (!meta) {
    return null;
  }
  return (
    <Label size="tiny" color={meta.color}>
      {meta.text}
    </Label>
  );
}

function renderField(task: Task, key: TaskColumnKey): ReactNode {
  switch (key) {
    case "dueDate":
      return formatDueDate(task.dueDate);
    case "duration":
      return formatDuration(task.duration);
    case "requiredSkills":
      return formatSkills(task) || "—";
    case "responsible":
      return formatResponsible(task);
    case "status":
      return <StatusLabel status={task.status} />;
    case "priority":
      return task.priority ?? "";
    case "name":
      return task.name ?? "";
    case "description":
      return task.description ?? "";
  }
}

function summaryMetaParts(
  task: Task,
  mobileSummary: readonly MobileSummaryField[],
): string[] {
  const parts: string[] = [];
  for (const field of mobileSummary) {
    if (field === "dueDate") {
      const due = formatDueDate(task.dueDate);
      if (due) {
        parts.push(`Due ${due}`);
      }
    } else if (field === "responsible") {
      const people = formatResponsible(task);
      if (people) {
        parts.push(people);
      }
    } else if (field === "duration") {
      const duration = formatDuration(task.duration);
      if (duration) {
        parts.push(duration);
      }
    }
  }
  return parts;
}

export default function TaskList({
  tasks,
  columns,
  mobileSummary = [],
  renderActions,
}: TaskListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const detailColumns = columns.filter((column) => {
    if (column.key === "name") {
      return false;
    }
    if (column.key === "status" && mobileSummary.includes("status")) {
      return false;
    }
    if (column.key === "dueDate" && mobileSummary.includes("dueDate")) {
      return false;
    }
    if (column.key === "responsible" && mobileSummary.includes("responsible")) {
      return false;
    }
    if (column.key === "duration" && mobileSummary.includes("duration")) {
      return false;
    }
    return true;
  });

  return (
    <>
      <div className="task-list-desktop">
        <Table celled selectable unstackable>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHeaderCell key={column.key}>{column.label}</TableHeaderCell>
              ))}
              {renderActions ? <TableHeaderCell /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task._id}>
                {columns.map((column) => (
                  <TableCell key={`${task._id}-${column.key}`}>
                    {renderField(task, column.key)}
                  </TableCell>
                ))}
                {renderActions ? <TableCell>{renderActions(task)}</TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {tasks.length === 0 ? null : (
        <div className="task-list-mobile">
          {tasks.map((task) => {
            const expanded = expandedId === task._id;
            const detailId = `task-detail-${task._id}`;
            const meta = summaryMetaParts(task, mobileSummary);
            return (
              <div
                key={task._id}
                className={expanded ? "task-list-row is-expanded" : "task-list-row"}
              >
                <button
                  type="button"
                  className="task-list-summary"
                  aria-expanded={expanded}
                  aria-controls={detailId}
                  onClick={() =>
                    setExpandedId((current) =>
                      current === task._id ? null : task._id,
                    )
                  }
                >
                  <div className="task-list-summary-top">
                    <span className="task-list-name">
                      {task.name || "Untitled task"}
                    </span>
                    <span className="task-list-summary-end">
                      {mobileSummary.includes("status") ? (
                        <StatusLabel status={task.status} />
                      ) : null}
                      <Icon
                        name={expanded ? "angle up" : "angle down"}
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                  {meta.length > 0 ? (
                    <div className="task-list-summary-meta">{meta.join(" · ")}</div>
                  ) : null}
                </button>
                {expanded ? (
                  <div className="task-list-detail" id={detailId}>
                    {detailColumns.length > 0 ? (
                      <dl>
                        {detailColumns.map((column) => {
                          const value = renderField(task, column.key);
                          if (value == null || value === "") {
                            return null;
                          }
                          return (
                            <div key={column.key}>
                              <dt>{column.label}</dt>
                              <dd>{value}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    ) : null}
                    {renderActions ? (
                      <div className="task-list-actions">{renderActions(task)}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
