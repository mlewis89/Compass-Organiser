"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Button,
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
import {
  buildTaskTree,
  filterTaskForest,
  type TaskTreeNode,
} from "@/lib/client/taskTree";
import { isCompleteStatus, isWishlistStatus } from "@/lib/taskStatus";

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
  nest?: boolean;
  showParentLabel?: boolean;
  hideWishlist?: boolean;
  hideCompleted?: boolean;
  onAddSubtask?: (task: Task) => void;
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

function TaskNameCell({
  task,
  depth,
  nest,
  showParentLabel,
  collapsed,
  onToggle,
}: {
  task: TaskTreeNode;
  depth: number;
  nest: boolean;
  showParentLabel: boolean;
  collapsed: boolean;
  onToggle?: () => void;
}) {
  const hasChildren = nest && task.children.length > 0;
  const parentName = task.parent?.name;
  return (
    <div
      className={task.isStub ? "task-list-name-wrap is-stub" : "task-list-name-wrap"}
      style={nest && depth > 0 ? { paddingLeft: depth * 1.25 + "rem" } : undefined}
    >
      {hasChildren ? (
        <button
          type="button"
          className="task-list-toggle"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand subtasks" : "Collapse subtasks"}
          onClick={(event) => {
            event.stopPropagation();
            onToggle?.();
          }}
        >
          <Icon name={collapsed ? "caret right" : "caret down"} />
        </button>
      ) : nest ? (
        <span className="task-list-toggle-spacer" />
      ) : null}
      <div className="task-list-name-text">
        <span className="task-list-name">{task.name || "Untitled task"}</span>
        {showParentLabel && parentName ? (
          <span className="task-list-parent-label">Under {parentName}</span>
        ) : null}
      </div>
    </div>
  );
}

function flattenForDisplay(
  nodes: TaskTreeNode[],
  collapsedIds: Set<string>,
): TaskTreeNode[] {
  const result: TaskTreeNode[] = [];
  const walk = (list: TaskTreeNode[]) => {
    for (const node of list) {
      result.push(node);
      if (!collapsedIds.has(node._id)) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return result;
}

export default function TaskList({
  tasks,
  columns,
  mobileSummary = [],
  renderActions,
  nest = true,
  showParentLabel = false,
  hideWishlist = false,
  hideCompleted = false,
  onAddSubtask,
}: TaskListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => {
    const source =
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
    if (!nest) {
      return source.map((task) => ({ ...task, children: [], depth: 0 }));
    }
    return buildTaskTree(source);
  }, [tasks, nest, hideWishlist, hideCompleted]);

  const rows = useMemo(
    () => flattenForDisplay(tree, collapsedIds),
    [tree, collapsedIds],
  );

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

  const toggleCollapsed = (taskId: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const actionsFor = (task: TaskTreeNode) => {
    if (task.isStub) {
      return null;
    }
    const addButton = onAddSubtask ? (
      <Button size="tiny" type="button" onClick={() => onAddSubtask(task)}>
        Add subtask
      </Button>
    ) : null;
    const provided = renderActions?.(task);
    if (!provided && !addButton) {
      return null;
    }
    return (
      <>
        {provided}
        {addButton}
      </>
    );
  };

  const showActions = Boolean(renderActions || onAddSubtask);

  return (
    <>
      <div className="task-list-desktop">
        <Table celled selectable unstackable>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHeaderCell key={column.key}>{column.label}</TableHeaderCell>
              ))}
              {showActions ? <TableHeaderCell /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((task) => (
              <TableRow
                key={task._id}
                className={task.isStub ? "task-list-stub-row" : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={`${task._id}-${column.key}`}>
                    {column.key === "name" ? (
                      <TaskNameCell
                        task={task}
                        depth={task.depth}
                        nest={nest}
                        showParentLabel={showParentLabel}
                        collapsed={collapsedIds.has(task._id)}
                        onToggle={() => toggleCollapsed(task._id)}
                      />
                    ) : task.isStub ? null : (
                      renderField(task, column.key)
                    )}
                  </TableCell>
                ))}
                {showActions ? <TableCell>{actionsFor(task)}</TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {tree.length === 0 ? null : (
        <div className="task-list-mobile">
          {tree.map((node) => (
            <MobileTaskBranch
              key={node._id}
              node={node}
              detailColumns={detailColumns}
              mobileSummary={mobileSummary}
              expandedIds={expandedIds}
              setExpandedIds={setExpandedIds}
              nest={nest}
              showParentLabel={showParentLabel}
              showActions={showActions}
              actionsFor={actionsFor}
            />
          ))}
        </div>
      )}
    </>
  );
}

function MobileTaskBranch({
  node,
  detailColumns,
  mobileSummary,
  expandedIds,
  setExpandedIds,
  nest,
  showParentLabel,
  showActions,
  actionsFor,
}: {
  node: TaskTreeNode;
  detailColumns: TaskColumn[];
  mobileSummary: readonly MobileSummaryField[];
  expandedIds: Set<string>;
  setExpandedIds: (updater: (current: Set<string>) => Set<string>) => void;
  nest: boolean;
  showParentLabel: boolean;
  showActions: boolean;
  actionsFor: (task: TaskTreeNode) => ReactNode;
}) {
  const expanded = expandedIds.has(node._id);
  const detailId = `task-detail-${node._id}`;
  const meta = node.isStub ? [] : summaryMetaParts(node, mobileSummary);
  const nestedChildren = nest ? node.children : [];

  return (
    <div className={expanded ? "task-list-row is-expanded" : "task-list-row"}>
      <button
        type="button"
        className="task-list-summary"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={() =>
          setExpandedIds((current) => {
            const next = new Set(current);
            if (next.has(node._id)) {
              next.delete(node._id);
            } else {
              next.add(node._id);
            }
            return next;
          })
        }
      >
        <div className="task-list-summary-top">
          <span className="task-list-name">
            {node.name || "Untitled task"}
            {showParentLabel && node.parent?.name ? (
              <span className="task-list-parent-label">
                {" "}
                Under {node.parent.name}
              </span>
            ) : null}
          </span>
          <span className="task-list-summary-end">
            {mobileSummary.includes("status") && !node.isStub ? (
              <StatusLabel status={node.status} />
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
          {node.isStub ? null : detailColumns.length > 0 ? (
            <dl>
              {detailColumns.map((column) => {
                const value = renderField(node, column.key);
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
          {showActions ? (
            <div className="task-list-actions">{actionsFor(node)}</div>
          ) : null}
          {nestedChildren.length > 0 ? (
            <div className="task-list-nested">
              {nestedChildren.map((child) => (
                <MobileTaskBranch
                  key={child._id}
                  node={child}
                  detailColumns={detailColumns}
                  mobileSummary={mobileSummary}
                  expandedIds={expandedIds}
                  setExpandedIds={setExpandedIds}
                  nest={nest}
                  showParentLabel={showParentLabel}
                  showActions={showActions}
                  actionsFor={actionsFor}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
