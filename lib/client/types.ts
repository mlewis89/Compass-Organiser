export type Skill = {
  _id: string;
  name: string;
  isActiveForUser?: boolean;
};

export type UserSummary = {
  _id: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  scoutName?: string | null;
  preferredName?: string | null;
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
  responsible?: UserSummary | null;
  createdBy?: UserSummary | null;
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
  lastName?: string | null;
  status?: string | null;
  gender?: string | null;
  section?: string | null;
  email?: string | null;
  phone?: string | null;
  taskAvailabity?: number | null;
};
