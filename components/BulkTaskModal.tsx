"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Form,
  FormField,
  Grid,
  GridColumn,
  GridRow,
  Modal,
  Segment,
  TextArea,
} from "semantic-ui-react";
import {
  QUERY_MEMBERS,
  QUERY_ME_TASKS,
  QUERY_TASKS,
  QUERY_UNIT_BUCKETS,
  QUERY_UNITS,
  QUERY_UNASSIGNED_TASKS,
  QUERY_USER_SKILLS,
} from "@/lib/client/queries";
import { ADD_TASKS } from "@/lib/client/mutations";
import type { Member, Skill, UnitSummary } from "@/lib/client/types";
import {
  countOutlineTasks,
  DEFAULT_OUTLINE_DURATION,
  DEFAULT_OUTLINE_PRIORITY,
  flattenOutline,
  outlineToMutationRoots,
  parseTaskOutline,
  type OutlineAssignment,
} from "@/lib/client/parseTaskOutline";
import { buildSkillTree, flattenSkillTree } from "@/lib/client/skillTree";
import PeopleUnitsSelect from "@/components/PeopleUnitsSelect";
import SearchMultiSelect from "@/components/SearchMultiSelect";

const PLACEHOLDER = `Event planning
  - Book venue
  - Send invitations
    - Design flyer
Weekend camp
  * Pack trailer`;

const DRAFT_KEY = "bulk-task-draft";

type BulkDraft = {
  text: string;
  assignments: Record<string, OutlineAssignment>;
};

function readDraft(): BulkDraft {
  if (typeof window === "undefined") {
    return { text: "", assignments: {} };
  }
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return { text: "", assignments: {} };
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { text: "", assignments: {} };
    }
    const record = parsed as { text?: unknown; assignments?: unknown };
    return {
      text: typeof record.text === "string" ? record.text : "",
      assignments:
        record.assignments &&
        typeof record.assignments === "object" &&
        !Array.isArray(record.assignments)
          ? (record.assignments as Record<string, OutlineAssignment>)
          : {},
    };
  } catch {
    return { text: "", assignments: {} };
  }
}

function writeDraft(text: string, assignments: Record<string, OutlineAssignment>) {
  if (typeof window === "undefined") {
    return;
  }
  if (!text.trim() && Object.keys(assignments).length === 0) {
    window.localStorage.removeItem(DRAFT_KEY);
    return;
  }
  window.localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ text, assignments } satisfies BulkDraft),
  );
}

function clearDraft() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(DRAFT_KEY);
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

function memberLabel(
  member: Pick<
    Member,
    "displayName" | "firstName" | "lastName" | "preferredName" | "scoutName"
  >,
) {
  return (
    member.displayName?.trim() ||
    member.preferredName?.trim() ||
    member.scoutName?.trim() ||
    [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
    "Unnamed member"
  );
}

function clampPriority(raw: string): number {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    return DEFAULT_OUTLINE_PRIORITY;
  }
  return Math.min(10, Math.max(0, value));
}

function clampDuration(raw: string): number {
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) {
    return DEFAULT_OUTLINE_DURATION;
  }
  return Math.min(20, Math.max(0, value));
}

export default function BulkTaskModal({ open, onClose, onSaved }: Props) {
  const [text, setText] = useState("");
  const [assignments, setAssignments] = useState<Record<string, OutlineAssignment>>(
    {},
  );
  const draftReady = useRef(false);

  useEffect(() => {
    if (!draftReady.current) {
      const draft = readDraft();
      setText(draft.text);
      setAssignments(draft.assignments);
      draftReady.current = true;
      return;
    }
    writeDraft(text, assignments);
  }, [text, assignments]);
  const forest = useMemo(() => parseTaskOutline(text), [text]);
  const previewRows = useMemo(() => flattenOutline(forest), [forest]);
  const taskCount = useMemo(() => countOutlineTasks(forest), [forest]);

  const { data: unitsData } = useQuery<{ units: UnitSummary[] }>(QUERY_UNITS, {
    skip: !open,
  });
  const { data: membersData } = useQuery<{ members: Member[] }>(QUERY_MEMBERS, {
    skip: !open,
  });
  const { data: skillsData } = useQuery<{ pageSkills: Skill[] }>(
    QUERY_USER_SKILLS,
    { skip: !open },
  );
  const unitOptions = useMemo(
    () =>
      (unitsData?.units ?? []).map((unit) => ({
        key: unit._id,
        value: unit._id,
        text: unit.name,
      })),
    [unitsData?.units],
  );
  const memberOptions = useMemo(
    () =>
      (membersData?.members ?? []).map((member) => ({
        key: member._id,
        value: member._id,
        text: memberLabel(member),
      })),
    [membersData?.members],
  );
  const skillOptions = useMemo(() => {
    const catalog = skillsData?.pageSkills ?? [];
    const byId = new Map(catalog.map((skill) => [skill._id, skill]));
    return flattenSkillTree(buildSkillTree(catalog)).map((skill) => ({
      key: skill._id,
      value: skill._id,
      text: skill.name?.trim() || "Unnamed skill",
      description: skill.parentId
        ? byId.get(skill.parentId)?.name?.trim() || undefined
        : undefined,
    }));
  }, [skillsData?.pageSkills]);

  const refetchQueries = [
    { query: QUERY_TASKS },
    { query: QUERY_UNIT_BUCKETS },
    { query: QUERY_UNASSIGNED_TASKS },
    { query: QUERY_ME_TASKS },
  ];
  const [addTasks, { loading }] = useMutation(ADD_TASKS, { refetchQueries });

  const handleClose = () => {
    onClose();
  };

  const handleCreated = () => {
    setText("");
    setAssignments({});
    clearDraft();
    onClose();
    onSaved?.();
  };

  const updateAssignment = (
    path: string,
    patch: Partial<OutlineAssignment>,
  ) => {
    setAssignments((current) => ({
      ...current,
      [path]: { ...current[path], ...patch },
    }));
  };

  return (
    <Modal
      centered={false}
      open={open}
      onClose={handleClose}
      aria-labelledby="bulk-task-modal"
      size="fullscreen"
      dimmer="blurring"
    >
      <Segment>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            if (taskCount === 0 || loading) {
              return;
            }
            void addTasks({
              variables: {
                roots: outlineToMutationRoots(forest, assignments),
              },
            }).then(() => {
              handleCreated();
            });
          }}
        >
          <h2 id="bulk-task-modal">Bulk create tasks</h2>
          <p>
            Each new line becomes a task. Indent and list markers (
            <code>- * + • 1.</code>) nest subtasks. Add people, units, or
            skills on each preview row; subtasks with no units inherit their
            parent&apos;s units.
          </p>
          <Grid stackable className="bulk-task-grid">
            <GridRow>
              <GridColumn width={5}>
                <FormField>
                  <label htmlFor="bulk-task-paste">Paste outline</label>
                  <TextArea
                    id="bulk-task-paste"
                    className="bulk-task-paste"
                    value={text}
                    rows={16}
                    placeholder={PLACEHOLDER}
                    onChange={(_event, data) => setText(String(data.value ?? ""))}
                  />
                </FormField>
              </GridColumn>
              <GridColumn width={11}>
                <label className="bulk-task-preview-label">Interpreted hierarchy</label>
                <Segment className="bulk-task-preview">
                  {previewRows.length === 0 ? (
                    <p className="bulk-task-preview-empty">
                      Paste an outline to preview tasks and nesting here.
                    </p>
                  ) : (
                    <>
                      <div className="bulk-task-preview-header">
                        <span className="bulk-task-preview-name">Task</span>
                        <span className="bulk-task-preview-assign">People and units</span>
                        <span className="bulk-task-preview-skills">Skills</span>
                        <span className="bulk-task-preview-priority">Pri</span>
                        <span className="bulk-task-preview-duration">Dur</span>
                      </div>
                      <ul className="bulk-task-preview-list">
                        {previewRows.map((row) => (
                          <li
                            key={row.path}
                            className="bulk-task-preview-item"
                          >
                            <span
                              className="bulk-task-preview-name"
                              style={{ paddingLeft: `${row.depth * 1.25}rem` }}
                            >
                              {row.name}
                            </span>
                            <PeopleUnitsSelect
                              className="bulk-task-preview-select bulk-task-preview-assign"
                              placeholder="Search members or units…"
                              aria-label={`People and units for ${row.name}`}
                              memberOptions={memberOptions}
                              unitOptions={unitOptions}
                              personIds={assignments[row.path]?.personIds ?? []}
                              unitIds={assignments[row.path]?.unitIds ?? []}
                              onChange={({ personIds, unitIds }) => {
                                updateAssignment(row.path, { personIds, unitIds });
                              }}
                            />
                            <SearchMultiSelect
                              className="bulk-task-preview-select bulk-task-preview-skills"
                              placeholder="Search skills…"
                              aria-label={`Skills for ${row.name}`}
                              options={skillOptions}
                              value={assignments[row.path]?.skillIds ?? []}
                              onChange={(skillIds) => {
                                updateAssignment(row.path, { skillIds });
                              }}
                            />
                            <label className="bulk-task-preview-metric bulk-task-preview-priority">
                              <span className="bulk-task-preview-metric-label">Pri</span>
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={1}
                                aria-label={`Priority for ${row.name}`}
                                value={
                                  assignments[row.path]?.priority ??
                                  DEFAULT_OUTLINE_PRIORITY
                                }
                                onChange={(event) => {
                                  updateAssignment(row.path, {
                                    priority: clampPriority(event.target.value),
                                  });
                                }}
                              />
                            </label>
                            <label className="bulk-task-preview-metric bulk-task-preview-duration">
                              <span className="bulk-task-preview-metric-label">Dur</span>
                              <input
                                type="number"
                                min={0}
                                max={20}
                                step={0.5}
                                aria-label={`Duration in hours for ${row.name}`}
                                value={
                                  assignments[row.path]?.duration ??
                                  DEFAULT_OUTLINE_DURATION
                                }
                                onChange={(event) => {
                                  updateAssignment(row.path, {
                                    duration: clampDuration(event.target.value),
                                  });
                                }}
                              />
                              <span className="bulk-task-preview-metric-suffix">hrs</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Segment>
              </GridColumn>
            </GridRow>
          </Grid>
          <Button
            type="submit"
            primary
            disabled={taskCount === 0 || loading}
            loading={loading}
          >
            {taskCount === 1 ? "Create 1 task" : `Create ${taskCount} tasks`}
          </Button>
          <Button type="button" onClick={handleClose}>
            Close
          </Button>
        </Form>
      </Segment>
    </Modal>
  );
}
