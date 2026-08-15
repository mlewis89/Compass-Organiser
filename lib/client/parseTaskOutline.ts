export type ParsedTaskNode = {
  name: string;
  children: ParsedTaskNode[];
};

export type OutlinePreviewRow = {
  name: string;
  depth: number;
  path: string;
};

export type OutlineAssignment = {
  personIds?: string[];
  unitIds?: string[];
  skillIds?: string[];
  priority?: number;
  duration?: number;
};

const LIST_MARKER = /^(?:[-*+•]|\d+[.)])\s+/;

function leadingIndent(line: string): number {
  let indent = 0;
  for (const character of line) {
    if (character === " ") {
      indent += 1;
    } else if (character === "\t") {
      indent += 2;
    } else {
      break;
    }
  }
  return indent;
}

function lineName(line: string): string {
  return line.trim().replace(LIST_MARKER, "").trim();
}

export function parseTaskOutline(text: string): ParsedTaskNode[] {
  const roots: ParsedTaskNode[] = [];
  const stack: { indent: number; node: ParsedTaskNode }[] = [];

  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) {
      continue;
    }
    const name = lineName(raw);
    if (!name) {
      continue;
    }

    const indent = leadingIndent(raw);
    const node: ParsedTaskNode = { name, children: [] };

    while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ indent, node });
  }

  return roots;
}

function nodePath(prefix: string, index: number): string {
  return prefix === "" ? String(index) : `${prefix}.${index}`;
}

export function flattenOutline(
  nodes: ParsedTaskNode[],
  depth = 0,
  prefix = "",
): OutlinePreviewRow[] {
  const rows: OutlinePreviewRow[] = [];
  nodes.forEach((node, index) => {
    const path = nodePath(prefix, index);
    rows.push({ name: node.name, depth, path });
    rows.push(...flattenOutline(node.children, depth + 1, path));
  });
  return rows;
}

export type OutlineMutationNode = {
  name: string;
  responsible: { _id: string }[];
  units: { _id: string }[];
  requiredSkills: { _id: string }[];
  priority: number;
  duration: number;
  children: OutlineMutationNode[];
};

export const DEFAULT_OUTLINE_PRIORITY = 5;
export const DEFAULT_OUTLINE_DURATION = 2;

export function outlineToMutationRoots(
  nodes: ParsedTaskNode[],
  assignments: Record<string, OutlineAssignment>,
  prefix = "",
): OutlineMutationNode[] {
  return nodes.map((node, index) => {
    const path = nodePath(prefix, index);
    const assignment = assignments[path];
    return {
      name: node.name,
      responsible: (assignment?.personIds ?? []).map((id) => ({ _id: id })),
      units: (assignment?.unitIds ?? []).map((id) => ({ _id: id })),
      requiredSkills: (assignment?.skillIds ?? []).map((id) => ({ _id: id })),
      priority: assignment?.priority ?? DEFAULT_OUTLINE_PRIORITY,
      duration: assignment?.duration ?? DEFAULT_OUTLINE_DURATION,
      children: outlineToMutationRoots(node.children, assignments, path),
    };
  });
}

export function countOutlineTasks(nodes: ParsedTaskNode[]): number {
  return nodes.reduce(
    (total, node) => total + 1 + countOutlineTasks(node.children),
    0,
  );
}
