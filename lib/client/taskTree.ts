import type { Task } from "@/lib/client/types";
import { interpretedPriority } from "@/lib/taskStatus";

export type TaskTreeNode = Task & {
  children: TaskTreeNode[];
  depth: number;
};

function sortByPriority(nodes: TaskTreeNode[]) {
  nodes.sort((a, b) => interpretedPriority(b) - interpretedPriority(a));
  for (const node of nodes) {
    sortByPriority(node.children);
  }
}

export function buildTaskTree(tasks: Task[], sort = true): TaskTreeNode[] {
  const byId = new Map<string, TaskTreeNode>();
  for (const task of tasks) {
    byId.set(task._id, { ...task, children: [], depth: 0 });
  }
  const roots: TaskTreeNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.parentTaskId;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const setDepth = (nodes: TaskTreeNode[], depth: number) => {
    for (const node of nodes) {
      node.depth = depth;
      setDepth(node.children, depth + 1);
    }
  };
  setDepth(roots, 0);
  if (sort) {
    sortByPriority(roots);
  }
  return roots;
}

export function flattenTaskTree(nodes: TaskTreeNode[]): TaskTreeNode[] {
  const result: TaskTreeNode[] = [];
  const walk = (list: TaskTreeNode[]) => {
    for (const node of list) {
      result.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

/** Drop hidden nodes; keep hidden parents as stubs when children remain. */
export function filterTaskForest(
  tasks: Task[],
  isVisible: (task: Task) => boolean,
): Task[] {
  const tree = buildTaskTree(tasks, false);
  const kept: TaskTreeNode[] = [];

  const walk = (node: TaskTreeNode): TaskTreeNode | null => {
    const children = node.children
      .map(walk)
      .filter((child): child is TaskTreeNode => child !== null);
    const selfVisible = isVisible(node) && !node.isStub;
    if (selfVisible) {
      return { ...node, children };
    }
    if (children.length === 0) {
      return null;
    }
    return { ...node, children, isStub: true };
  };

  for (const root of tree) {
    const next = walk(root);
    if (next) {
      kept.push(next);
    }
  }
  sortByPriority(kept);
  return flattenTaskTree(kept);
}

export function taskForestHasVisible(tasks: Task[]): boolean {
  return tasks.some((task) => !task.isStub);
}
