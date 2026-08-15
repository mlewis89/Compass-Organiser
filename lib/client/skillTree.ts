import type { Skill } from "@/lib/client/types";

export type SkillTreeNode = Skill & { children: SkillTreeNode[] };

export function buildSkillTree(skills: Skill[]): SkillTreeNode[] {
  const byId = new Map<string, SkillTreeNode>();
  for (const skill of skills) {
    byId.set(skill._id, { ...skill, children: [] });
  }
  const roots: SkillTreeNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.parentId;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortNodes = (nodes: SkillTreeNode[]) => {
    nodes.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };
  sortNodes(roots);
  return roots;
}

export function flattenSkillTree(nodes: SkillTreeNode[]): SkillTreeNode[] {
  const result: SkillTreeNode[] = [];
  const walk = (list: SkillTreeNode[]) => {
    for (const node of list) {
      result.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

export function filterSkillsByQuery(skills: Skill[], query: string): Skill[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return skills;
  }
  const matchedIds = new Set(
    skills
      .filter((skill) => (skill.name ?? "").toLowerCase().includes(q))
      .map((skill) => skill._id),
  );
  // Keep ancestors of matches so hierarchy still makes sense
  const byId = new Map(skills.map((skill) => [skill._id, skill]));
  for (const id of [...matchedIds]) {
    let current = byId.get(id);
    while (current?.parentId) {
      matchedIds.add(current.parentId);
      current = byId.get(current.parentId);
    }
  }
  return skills.filter((skill) => matchedIds.has(skill._id));
}
