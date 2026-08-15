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
  QUERY_GROUP_SKILLS,
  QUERY_USER_SKILLS,
} from "@/lib/client/queries";
import {
  ARCHIVE_SKILL,
  CREATE_SKILL,
  REQUEST_PROMOTE_SKILL,
  UPDATE_SKILL_CATALOG,
} from "@/lib/client/mutations";
import type { Skill } from "@/lib/client/types";

export default function GroupSkillsPanel() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data, refetch, loading } = useQuery<{ groupSkills: Skill[] }>(
    QUERY_GROUP_SKILLS,
    { variables: { includeArchived } },
  );
  const { data: catalogData } = useQuery<{ pageSkills: Skill[] }>(QUERY_USER_SKILLS);

  const [createSkill, { loading: creating }] = useMutation(CREATE_SKILL, {
    refetchQueries: [{ query: QUERY_USER_SKILLS }, { query: QUERY_GROUP_SKILLS }],
  });
  const [updateSkill] = useMutation(UPDATE_SKILL_CATALOG);
  const [archiveSkill] = useMutation(ARCHIVE_SKILL);
  const [promoteSkill] = useMutation(REQUEST_PROMOTE_SKILL);

  const skills = data?.groupSkills ?? [];
  const parentOptions = useMemo(() => {
    const visible = catalogData?.pageSkills ?? [];
    return visible.filter((skill) => !skill.parentId);
  }, [catalogData?.pageSkills]);
  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of [...skills, ...(catalogData?.pageSkills ?? [])]) {
      map.set(skill._id, skill.name ?? "");
    }
    return map;
  }, [skills, catalogData?.pageSkills]);

  const refresh = async () => {
    await refetch();
  };

  const handleCreate = async () => {
    setError(null);
    setMessage(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      await createSkill({
        variables: {
          skill: { name: name.trim(), parentId: parentId || undefined },
        },
      });
      setName("");
      setParentId("");
      setMessage("Skill created");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create skill");
    }
  };

  return (
    <Segment padded>
      <Header as="h3">Group skills</Header>
      <p>
        Skills created for this group (including those invented on tasks). Archive
        unused ones, or request promotion to the platform defaults catalog.
      </p>

      <Form
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <FormField
          control={Input}
          label="New group skill"
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
          Add skill
        </Button>
      </Form>

      <div style={{ margin: "1rem 0" }}>
        <Checkbox
          label="Show archived"
          checked={includeArchived}
          onChange={(_event, field) =>
            setIncludeArchived(Boolean(field.checked))
          }
        />
      </div>

      {error ? <Message negative content={error} /> : null}
      {message ? <Message positive content={message} /> : null}

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
          {loading ? (
            <TableRow>
              <TableCell colSpan={6}>Loading…</TableCell>
            </TableRow>
          ) : skills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>No group skills yet.</TableCell>
            </TableRow>
          ) : (
            skills.map((skill) => (
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
                    <>
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
                      <Button
                        size="mini"
                        type="button"
                        onClick={() => {
                          void promoteSkill({
                            variables: { skillId: skill._id },
                          })
                            .then(() => {
                              setMessage(
                                `Promotion requested for “${skill.name}”`,
                              );
                            })
                            .catch((err: Error) => setError(err.message));
                        }}
                      >
                        Promote
                      </Button>
                    </>
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
  );
}
