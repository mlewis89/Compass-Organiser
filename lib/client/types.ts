export type Skill = {
  _id: string;
  name: string;
  isActiveForUser?: boolean;
  parentId?: string | null;
  scope?: string | null;
  groupId?: string | null;
  group?: GroupSummary | null;
  status?: string | null;
  createdByUserId?: string | null;
  taskCount?: number | null;
  userCount?: number | null;
};

export type UserSummary = {
  _id: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  scoutName?: string | null;
  preferredName?: string | null;
};

export type UnitSummary = {
  _id: string;
  name: string;
  members?: UserSummary[];
};

export type Task = {
  _id: string;
  name?: string | null;
  description?: string | null;
  priority?: number | null;
  dueDate?: string | null;
  duration?: number | null;
  status?: string | null;
  requiredSkills?: Skill[];
  responsible?: UserSummary[];
  units?: UnitSummary[];
  createdBy?: UserSummary | null;
  parentTaskId?: string | null;
  parent?: { _id: string; name?: string | null } | null;
  descendantCount?: number | null;
  isStub?: boolean | null;
};

export type UnitBucket = {
  unit: UnitSummary;
  tasks: Task[];
  allocated: number;
  total: number;
};

export type EventItem = {
  _id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  isPublic?: boolean | null;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  cost?: number | null;
  plan?: string | null;
  riskManagement?: string | null;
  organisor?: UserSummary | null;
  attending?: UserSummary[];
};

export type BoardPost = {
  _id: string;
  title?: string | null;
  content?: string | null;
  image?: string | null;
  isPublic?: boolean | null;
  expiryDate?: string | null;
  Priority?: number | null;
  createdBy?: UserSummary | null;
};

export type Member = {
  _id: string;
  scoutRego?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  scoutName?: string | null;
  status?: string | null;
  gender?: string | null;
  dob?: string | null;
  section?: string | null;
  email?: string | null;
  phone?: string | null;
  taskAvailabity?: number | null;
  accountStatus?: string | null;
  role?: Role[] | null;
};

export type Role = {
  _id: string;
  name?: string | null;
  prequistes?: string | null;
  requiredTraining?: string | null;
  reportsTo?: { _id: string; name?: string | null } | null;
  isUniformed?: boolean | null;
};

export type Permissions = {
  roles?: string[] | null;
  canManageTasks?: boolean | null;
  canManageEvents?: boolean | null;
  canManagePosts?: boolean | null;
  canManageMembers?: boolean | null;
  canManageGroupModules?: boolean | null;
  canViewAllUnitBuckets?: boolean | null;
  isPlatformAdmin?: boolean | null;
};

export type EnabledModules = {
  tasks: boolean;
  events: boolean;
  noticeBoard: boolean;
  memberStats: boolean;
  skills: boolean;
};

export type GroupSummary = {
  _id: string;
  name: string;
  slug: string;
  status?: string | null;
  enabledModules?: EnabledModules | null;
};

export type AdminGroup = GroupSummary & {
  memberCount: number;
};
