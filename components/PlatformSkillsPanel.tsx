"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  FormField,
  Header,
  Input,
  Label,
  Message,
  Segment,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import {
  QUERY_ADMIN_GROUP_SKILLS,
  QUERY_PLATFORM_SKILLS,
} from "@/lib/client/queries";
import {
  ARCHIVE_SKILL,
  CREATE_PLATFORM_SKILL,
  MERGE_SKILLS,
  PROMOTE_GROUP_SKILL,
  UPDATE_SKILL_CATALOG,
} from "@/lib/client/mutations";
import type { Skill } from "@/lib/client/types";

function skillLabel(skill: Skill) {
  const statusNote =
    skill.status === "archived"
      ? ", archived"
      : skill.status === "pending"
        ? ", pending"
        : "";
  if (skill.scope === "platform") {
    return `${skill.name} (platform${statusNote})`;
  }
  const groupName = skill.group?.name ?? "group";
  return `${skill.name} (${groupName}${statusNote})`;
}

export default function PlatformSkillsPanel() {
  const [includeArchivedGroups, setIncludeArchivedGroups] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeSourceIds, setMergeSourceIds] = useState<string[]>([]);

  const {
    data: platformData,
    refetch: refetchPlatform,
    loading: loadingPlatform,
  } = useQuery<{ platformSkills: Skill[] }>(QUERY_PLATFORM_SKILLS);

  const {
    data: groupData,
    refetch: refetchGroups,
    loading: loadingGroups,
  } = useQuery<{ adminGroupSkills: Skill[] }>(QUERY_ADMIN_GROUP_SKILLS, {
    variables: { includeArchived: includeArchivedGroups },
  });

  const [createSkill, { loading: creating }] = useMutation(CREATE_PLATFORM_SKILL);
  const [updateSkill] = useMutation(UPDATE_SKILL_CATALOG);
  const [archiveSkill] = useMutation(ARCHIVE_SKILL);
  const [promoteSkill, { loading: promoting }] = useMutation(PROMOTE_GROUP_SKILL);
  const [mergeSkills, { loading: merging }] = useMutation(MERGE_SKILLS);

  const platformCatalog = platformData?.platformSkills ?? [];
  const platformDefaults = platformCatalog.filter(
    (skill) => skill.status !== "pending",
  );
  const groupSkills = groupData?.adminGroupSkills ?? [];
  const parentOptions = useMemo(
    () =>
      platformDefaults.filter(
        (skill) => !skill.parentId && skill.status === "approved",
      ),
    [platformDefaults],
  );
  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of [...platformCatalog, ...groupSkills]) {
      map.set(skill._id, skill.name ?? "");
    }
    return map;
  }, [platformCatalog, groupSkills]);

  const mergeCandidates = useMemo(() => {
    const byId = new Map<string, Skill>();
    for (const skill of [...platformCatalog, ...groupSkills]) {
      byId.set(skill._id, skill);
    }
    return [...byId.values()].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    );
  }, [platformCatalog, groupSkills]);

  const mergeTarget =
    mergeCandidates.find((skill) => skill._id === mergeTargetId) ?? null;
  const mergeSources = mergeCandidates.filter((skill) =>
    mergeSourceIds.includes(skill._id),
  );
  const mergeSourceTaskCount = mergeSources.reduce(
    (sum, skill) => sum + (skill.taskCount ?? 0),
    0,
  );
  const mergeSourceUserCount = mergeSources.reduce(
    (sum, skill) => sum + (skill.userCount ?? 0),
    0,
  );
  const canMerge =
    mergeTarget?.scope === "platform" &&
    mergeSources.length > 0 &&
    !mergeSourceIds.includes(mergeTargetId);

  const refresh = async () => {
    await Promise.all([refetchPlatform(), refetchGroups()]);
  };

  const toggleMergeSource = (skillId: string, checked: boolean) => {
    setMergeSourceIds((current) => {
      if (!checked) {
        return current.filter((id) => id !== skillId);
      }
      if (skillId === mergeTargetId || current.includes(skillId)) {
        return current;
      }
      return [...current, skillId];
    });
  };

  return (
    <>
      {error ? <Message negative content={error} /> : null}
      {message ? <Message positive content={message} /> : null}

      <Segment padded>
        <Header as="h3">Group skills</Header>
        <p>
          Promote a group skill to the platform catalog. Existing tasks and
          users keep pointing at the same skill.
        </p>
        <div style={{ margin: "0 0 1rem" }}>
          <Checkbox
            label="Include archived group skills"
            checked={includeArchivedGroups}
            onChange={(_event, field) =>
              setIncludeArchivedGroups(Boolean(field.checked))
            }
          />
        </div>
        <Table celled compact>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Group</TableHeaderCell>
              <TableHeaderCell>Parent</TableHeaderCell>
              <TableHeaderCell>Tasks</TableHeaderCell>
              <TableHeaderCell>Users</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingGroups ? (
              <TableRow>
                <TableCell colSpan={6}>Loading…</TableCell>
              </TableRow>
            ) : groupSkills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No group skills.</TableCell>
              </TableRow>
            ) : (
              groupSkills.map((skill) => (
                <TableRow key={skill._id}>
                  <TableCell>
                    {skill.name}
                    {skill.status === "archived" ? (
                      <Label size="mini" style={{ marginLeft: "0.5rem" }}>
                        archived
                      </Label>
                    ) : null}
                  </TableCell>
                  <TableCell>{skill.group?.name ?? "—"}</TableCell>
                  <TableCell>
                    {skill.parentId
                      ? parentNameById.get(skill.parentId) ?? "—"
                      : "—"}
                  </TableCell>
                  <TableCell>{skill.taskCount ?? 0}</TableCell>
                  <TableCell>{skill.userCount ?? 0}</TableCell>
                  <TableCell>
                    {skill.status !== "archived" ? (
                      <Button
                        size="mini"
                        type="button"
                        loading={promoting}
                        onClick={() => {
                          setError(null);
                          setMessage(null);
                          void promoteSkill({
                            variables: { skillId: skill._id },
                          })
                            .then(() => {
                              setMessage(
                                `“${skill.name}” is now a platform skill`,
                              );
                              return refresh();
                            })
                            .catch((err: Error) => setError(err.message));
                        }}
                      >
                        Promote
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Segment>

      <Segment padded>
        <Header as="h3">Merge skills</Header>
        <p>
          Collapse duplicate skills into one entity. Keep a platform skill so
          every group can still use it. Tasks and users on the merged skills
          move onto that platform skill.
        </p>
        <Table celled compact>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Keep</TableHeaderCell>
              <TableHeaderCell>Merge</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Scope</TableHeaderCell>
              <TableHeaderCell>Tasks</TableHeaderCell>
              <TableHeaderCell>Users</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingPlatform || loadingGroups ? (
              <TableRow>
                <TableCell colSpan={6}>Loading…</TableCell>
              </TableRow>
            ) : mergeCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No skills to merge.</TableCell>
              </TableRow>
            ) : (
              mergeCandidates.map((skill) => (
                <TableRow key={skill._id}>
                  <TableCell collapsing>
                    <input
                      type="radio"
                      name="merge-target"
                      aria-label={`Keep ${skill.name}`}
                      disabled={skill.scope !== "platform"}
                      checked={mergeTargetId === skill._id}
                      onChange={() => {
                        setMergeTargetId(skill._id);
                        setMergeSourceIds((current) =>
                          current.filter((id) => id !== skill._id),
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell collapsing>
                    <Checkbox
                      checked={mergeSourceIds.includes(skill._id)}
                      disabled={mergeTargetId === skill._id}
                      aria-label={`Merge ${skill.name}`}
                      onChange={(_event, field) =>
                        toggleMergeSource(skill._id, Boolean(field.checked))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {skill.name}
                    {skill.status === "archived" || skill.status === "pending" ? (
                      <Label size="mini" style={{ marginLeft: "0.5rem" }}>
                        {skill.status}
                      </Label>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {skill.scope === "platform"
                      ? "Platform"
                      : (skill.group?.name ?? "Group")}
                  </TableCell>
                  <TableCell>{skill.taskCount ?? 0}</TableCell>
                  <TableCell>{skill.userCount ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {canMerge && mergeTarget ? (
          <Message info>
            Merge {mergeSources.map(skillLabel).join(", ")} into{" "}
            {skillLabel(mergeTarget)}. {mergeSourceTaskCount} task
            {mergeSourceTaskCount === 1 ? "" : "s"} and {mergeSourceUserCount}{" "}
            user{mergeSourceUserCount === 1 ? "" : "s"} will move. Removed
            names: {mergeSources.map((skill) => skill.name).join(", ")}.
          </Message>
        ) : (
          <p>
            Select a platform skill to keep and at least one skill to merge into
            it.
          </p>
        )}
        <Button
          type="button"
          primary
          disabled={!canMerge}
          loading={merging}
          onClick={() => {
            if (!canMerge || !mergeTarget) {
              return;
            }
            const confirmed = window.confirm(
              `Merge ${mergeSources.map((skill) => skill.name).join(", ")} into ${mergeTarget.name}? This cannot be undone.`,
            );
            if (!confirmed) {
              return;
            }
            setError(null);
            setMessage(null);
            void mergeSkills({
              variables: {
                targetId: mergeTarget._id,
                sourceIds: mergeSources.map((skill) => skill._id),
              },
            })
              .then(() => {
                setMergeSourceIds([]);
                setMessage(`Merged into “${mergeTarget.name}”`);
                return refresh();
              })
              .catch((err: Error) => setError(err.message));
          }}
        >
          Merge skills
        </Button>
      </Segment>

      <Segment padded>
        <Header as="h3">Platform skill defaults</Header>
        <p>Approved skills appear in every group&apos;s skill pickers.</p>

        <Form
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setMessage(null);
            if (!name.trim()) {
              setError("Name is required");
              return;
            }
            void createSkill({
              variables: {
                skill: { name: name.trim(), parentId: parentId || undefined },
              },
            })
              .then(() => {
                setName("");
                setParentId("");
                setMessage("Platform skill created");
                return refresh();
              })
              .catch((err: Error) => setError(err.message));
          }}
        >
          <FormField
            control={Input}
            label="New platform skill"
            placeholder="Skill name"
            value={name}
            onChange={(
              _event: React.ChangeEvent<HTMLInputElement>,
              field: { value?: string },
            ) => setName(field.value ?? "")}
          />
          <FormField>
            <label>Parent (optional)</label>
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="">None</option>
              {parentOptions.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </FormField>
          <Button type="submit" primary loading={creating}>
            Add platform skill
          </Button>
        </Form>

        <Table celled compact>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Parent</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Tasks</TableHeaderCell>
              <TableHeaderCell>Users</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingPlatform ? (
              <TableRow>
                <TableCell colSpan={6}>Loading…</TableCell>
              </TableRow>
            ) : (
              platformDefaults.map((skill) => (
                <TableRow key={skill._id}>
                  <TableCell>
                    <Input
                      fluid
                      defaultValue={skill.name ?? ""}
                      onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                        const next = event.target.value.trim();
                        if (!next || next === skill.name) {
                          return;
                        }
                        void updateSkill({
                          variables: {
                            skillId: skill._id,
                            skill: { name: next },
                          },
                        }).then(() => refresh());
                      }}
                    />
                    {skill.status === "archived" ? (
                      <Label size="mini" style={{ marginLeft: "0.5rem" }}>
                        archived
                      </Label>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {skill.parentId
                      ? parentNameById.get(skill.parentId) ?? "—"
                      : "—"}
                  </TableCell>
                  <TableCell>{skill.status}</TableCell>
                  <TableCell>{skill.taskCount ?? 0}</TableCell>
                  <TableCell>{skill.userCount ?? 0}</TableCell>
                  <TableCell>
                    {skill.status !== "archived" ? (
                      <Button
                        size="mini"
                        type="button"
                        onClick={() => {
                          void archiveSkill({
                            variables: { skillId: skill._id },
                          }).then(() => refresh());
                        }}
                      >
                        Archive
                      </Button>
                    ) : (
                      <Button
                        size="mini"
                        type="button"
                        onClick={() => {
                          void updateSkill({
                            variables: {
                              skillId: skill._id,
                              skill: { status: "approved" },
                            },
                          }).then(() => refresh());
                        }}
                      >
                        Restore
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Segment>
    </>
  );
}
