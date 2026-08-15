"use client";

import { useLayoutEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
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
import {
  interpretedPriority,
  isCompleteStatus,
  isWishlistStatus,
} from "@/lib/taskStatus";
import { getTaskDragId, setTaskDragData } from "@/lib/client/taskDrag";

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
  nest?: boolean;
  showParentLabel?: boolean;
  hideWishlist?: boolean;
  hideCompleted?: boolean;
  onOpen?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onAddSubtask?: (task: Task) => void;
  nameExtraAction?: (task: Task) => ReactNode;
  statusExtraAction?: (task: Task) => ReactNode;
  canDrag?: boolean;
  onTaskDragStart?: (taskId: string) => void;
  onTaskDragEnd?: () => void;
  onTaskDrop?: (taskId: string) => void;
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

function DescriptionCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element || expanded) {
      return;
    }
    setOverflows(element.scrollHeight > element.clientHeight + 1);
  }, [text, expanded]);

  if (!text) {
    return "";
  }

  return (
    <div className="task-list-description">
      <p
        ref={textRef}
        className={
          expanded
            ? "task-list-description-text is-expanded"
            : "task-list-description-text"
        }
      >
        {text}
      </p>
      {overflows || expanded ? (
        <button
          type="button"
          className="task-list-description-more"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
        >
          {expanded ? "Less" : "More"}
        </button>
      ) : null}
    </div>
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
      return task.priority == null && !isWishlistStatus(task.status)
        ? ""
        : interpretedPriority(task);
    case "name":
      return task.name ?? "";
    case "description":
      return <DescriptionCell text={task.description ?? ""} />;
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

function stopRowClick(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function TaskNameCell({
  task,
  depth,
  nest,
  showParentLabel,
  collapsed,
  onToggle,
  nameActions,
}: {
  task: TaskTreeNode;
  depth: number;
  nest: boolean;
  showParentLabel: boolean;
  collapsed: boolean;
  onToggle?: () => void;
  nameActions?: ReactNode;
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
        {nameActions ? (
          <div className="task-list-name-actions" onClick={stopRowClick}>
            {nameActions}
          </div>
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
  nest = true,
  showParentLabel = false,
  hideWishlist = false,
  hideCompleted = false,
  onOpen,
  onComplete,
  onAddSubtask,
  nameExtraAction,
  statusExtraAction,
  canDrag = false,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop,
}: TaskListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const skipClickRef = useRef(false);
  const [compact, setCompact] = useState(false);
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

  const nameActionsFor = (task: TaskTreeNode) => {
    if (task.isStub) {
      return null;
    }
    const openButton = onOpen ? (
      <Button
        basic
        size="mini"
        compact
        type="button"
        onClick={() => onOpen(task)}
      >
        Open
      </Button>
    ) : null;
    const addButton = onAddSubtask ? (
      <Button
        basic
        size="mini"
        compact
        type="button"
        onClick={() => onAddSubtask(task)}
      >
        Add subtask
      </Button>
    ) : null;
    const extra = nameExtraAction?.(task);
    if (!openButton && !addButton && !extra) {
      return null;
    }
    return (
      <>
        {openButton}
        {addButton}
        {extra}
      </>
    );
  };

  const completeButtonFor = (task: TaskTreeNode) => {
    if (task.isStub || !onComplete || isCompleteStatus(task.status)) {
      return null;
    }
    return (
      <Button
        positive
        size="mini"
        compact
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onComplete(task);
        }}
      >
        Mark as complete
      </Button>
    );
  };

  const statusExtraFor = (task: TaskTreeNode) => {
    if (task.isStub || !statusExtraAction) {
      return null;
    }
    return (
      <span
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {statusExtraAction(task)}
      </span>
    );
  };

  const actionsFor = (task: TaskTreeNode) => {
    if (task.isStub) {
      return null;
    }
    const nameActions = nameActionsFor(task);
    const completeButton = completeButtonFor(task);
    const statusExtra = statusExtraFor(task);
    if (!nameActions && !completeButton && !statusExtra) {
      return null;
    }
    return (
      <>
        {nameActions}
        {completeButton}
        {statusExtra}
      </>
    );
  };

  const showActions = Boolean(
    onOpen || onComplete || onAddSubtask || nameExtraAction || statusExtraAction,
  );

  const beginTaskDrag = (task: TaskTreeNode, event: DragEvent<HTMLElement>) => {
    event.stopPropagation();
    skipClickRef.current = true;
    setTaskDragData(event.dataTransfer, task._id);
    onTaskDragStart?.(task._id);
  };

  const finishTaskDrag = () => {
    onTaskDragEnd?.();
    window.setTimeout(() => {
      skipClickRef.current = false;
    }, 0);
  };

  const handleListDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!onTaskDrop) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleListDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!onTaskDrop) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const taskId = getTaskDragId(event.dataTransfer);
    if (taskId) {
      onTaskDrop(taskId);
    }
  };

  const handleRowClick = (task: TaskTreeNode) => {
    if (skipClickRef.current) {
      return;
    }
    onOpen?.(task);
  };

  const renderCell = (task: TaskTreeNode, key: TaskColumnKey) => {
    if (key === "name") {
      return (
        <TaskNameCell
          task={task}
          depth={task.depth}
          nest={nest}
          showParentLabel={showParentLabel}
          collapsed={collapsedIds.has(task._id)}
          onToggle={() => toggleCollapsed(task._id)}
          nameActions={nameActionsFor(task)}
        />
      );
    }
    if (task.isStub) {
      return null;
    }
    if (key === "status") {
      return (
        <div className="task-list-status-cell">
          <StatusLabel status={task.status} />
          {completeButtonFor(task)}
          {statusExtraFor(task)}
        </div>
      );
    }
    return renderField(task, key);
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    const wrap = tableWrapRef.current;
    if (!list || !wrap) {
      return;
    }

    const measure = () => {
      const table = wrap.querySelector("table");
      if (!table) {
        return;
      }
      const available = list.clientWidth;
      const needed = table.scrollWidth;
      setCompact((wasCompact) => {
        if (wasCompact) {
          return needed > available - 16;
        }
        return needed > available + 1;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [rows, columns, showActions]);

  return (
    <div
      ref={listRef}
      className={compact ? "task-list is-compact" : "task-list"}
      onDragOver={handleListDragOver}
      onDrop={handleListDrop}
    >
      <div className="task-list-desktop" ref={tableWrapRef}>
        <Table celled selectable unstackable>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHeaderCell key={column.key}>{column.label}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((task) => {
              const canOpen = Boolean(onOpen) && !task.isStub;
              const rowDraggable = canDrag && !task.isStub;
              return (
                <TableRow
                  key={task._id}
                  draggable={rowDraggable}
                  className={
                    [
                      task.isStub ? "task-list-stub-row" : null,
                      canOpen ? "task-list-row-open" : null,
                      rowDraggable ? "task-list-draggable" : null,
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  onDragStart={
                    rowDraggable
                      ? (event: DragEvent<HTMLElement>) => beginTaskDrag(task, event)
                      : undefined
                  }
                  onDragEnd={rowDraggable ? finishTaskDrag : undefined}
                  onClick={canOpen ? () => handleRowClick(task) : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={`${task._id}-${column.key}`}>
                      {renderCell(task, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
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
              canDrag={canDrag}
              onTaskDragStart={onTaskDragStart}
              onTaskDragEnd={onTaskDragEnd}
            />
          ))}
        </div>
      )}
    </div>
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
  canDrag,
  onTaskDragStart,
  onTaskDragEnd,
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
  canDrag: boolean;
  onTaskDragStart?: (taskId: string) => void;
  onTaskDragEnd?: () => void;
}) {
  const expanded = expandedIds.has(node._id);
  const detailId = `task-detail-${node._id}`;
  const meta = node.isStub ? [] : summaryMetaParts(node, mobileSummary);
  const nestedChildren = nest ? node.children : [];
  const rowDraggable = canDrag && !node.isStub;

  return (
    <div
      className={
        [
          expanded ? "task-list-row is-expanded" : "task-list-row",
          rowDraggable ? "task-list-draggable" : null,
        ]
          .filter(Boolean)
          .join(" ")
      }
      draggable={rowDraggable}
      onDragStart={
        rowDraggable
          ? (event) => {
              event.stopPropagation();
              setTaskDragData(event.dataTransfer, node._id);
              onTaskDragStart?.(node._id);
            }
          : undefined
      }
      onDragEnd={rowDraggable ? onTaskDragEnd : undefined}
    >
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
                  canDrag={canDrag}
                  onTaskDragStart={onTaskDragStart}
                  onTaskDragEnd={onTaskDragEnd}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
