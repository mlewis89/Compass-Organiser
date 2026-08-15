export const MODULE_SETTINGS_ROLES = [
  "GroupLeader",
  "AssistGroupLeader",
] as const;

/** Modules stored on the group (user-togglable). */
export type StoredEnabledModules = {
  tasks: boolean;
  events: boolean;
  noticeBoard: boolean;
  memberStats: boolean;
};

/** Stored modules plus derived flags (skills follows tasks). */
export type EnabledModules = StoredEnabledModules & {
  skills: boolean;
};

export type ModuleKey = keyof EnabledModules;
export type StoredModuleKey = keyof StoredEnabledModules;

export const DEFAULT_STORED_MODULES: StoredEnabledModules = {
  tasks: true,
  events: true,
  noticeBoard: true,
  memberStats: true,
};

export function normalizeStoredModules(
  raw: unknown,
): StoredEnabledModules {
  const base =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return {
    tasks: typeof base.tasks === "boolean" ? base.tasks : DEFAULT_STORED_MODULES.tasks,
    events:
      typeof base.events === "boolean" ? base.events : DEFAULT_STORED_MODULES.events,
    noticeBoard:
      typeof base.noticeBoard === "boolean"
        ? base.noticeBoard
        : DEFAULT_STORED_MODULES.noticeBoard,
    memberStats:
      typeof base.memberStats === "boolean"
        ? base.memberStats
        : DEFAULT_STORED_MODULES.memberStats,
  };
}

export function expandEnabledModules(
  stored: StoredEnabledModules | unknown,
): EnabledModules {
  const normalized = normalizeStoredModules(stored);
  return {
    ...normalized,
    skills: normalized.tasks,
  };
}

export function isModuleEnabled(
  modules: StoredEnabledModules | EnabledModules | unknown,
  key: ModuleKey,
): boolean {
  return expandEnabledModules(modules)[key];
}

export function mergeModuleUpdates(
  current: StoredEnabledModules | unknown,
  updates: Partial<StoredEnabledModules>,
): StoredEnabledModules {
  const base = normalizeStoredModules(current);
  return {
    tasks: typeof updates.tasks === "boolean" ? updates.tasks : base.tasks,
    events: typeof updates.events === "boolean" ? updates.events : base.events,
    noticeBoard:
      typeof updates.noticeBoard === "boolean"
        ? updates.noticeBoard
        : base.noticeBoard,
    memberStats:
      typeof updates.memberStats === "boolean"
        ? updates.memberStats
        : base.memberStats,
  };
}
