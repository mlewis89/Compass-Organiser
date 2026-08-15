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
import { QUERY_PLATFORM_SKILLS } from "@/lib/client/queries";
import {
  APPROVE_PLATFORM_SKILL,
  ARCHIVE_SKILL,
  CREATE_PLATFORM_SKILL,
  REJECT_PLATFORM_SKILL,
  UPDATE_SKILL_CATALOG,
} from "@/lib/client/mutations";
import type { Skill } from "@/lib/client/types";

export default function PlatformSkillsPanel() {
  const [includePending, setIncludePending] = useState(true);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data, refetch, loading } = useQuery<{ platformSkills: Skill[] }>(
    QUERY_PLATFORM_SKILLS,
    { variables: { includePending } },
  );

  const [createSkill, { loading: creating }] = useMutation(CREATE_PLATFORM_SKILL);
  const [updateSkill] = useMutation(UPDATE_SKILL_CATALOG);
  const [archiveSkill] = useMutation(ARCHIVE_SKILL);
  const [approveSkill] = useMutation(APPROVE_PLATFORM_SKILL);
  const [rejectSkill] = useMutation(REJECT_PLATFORM_SKILL);

  const skills = data?.platformSkills ?? [];
  const pending = skills.filter((skill) => skill.status === "pending");
  const catalog = skills.filter((skill) => skill.status !== "pending");
  const parentOptions = useMemo(
    () =>
      catalog.filter(
        (skill) => !skill.parentId && skill.status === "approved",
      ),
    [catalog],
  );
  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of skills) {
      map.set(skill._id, skill.name ?? "");
    }
    return map;
  }, [skills]);

  const refresh = async () => {
    await refetch();
  };

  return (
    <>
      <Segment padded>
        <Header as="h3">Pending promotions</Header>
        {pending.length === 0 ? (
          <p>No pending skill promotions.</p>
        ) : (
          <Table celled compact>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((skill) => (
                <TableRow key={skill._id}>
                  <TableCell>{skill.name}</TableCell>
                  <TableCell>
                    <Button
                      size="mini"
                      positive
                      type="button"
                      onClick={() => {
                        void approveSkill({
                          variables: { skillId: skill._id },
                        }).then(() => refresh());
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="mini"
                      negative
                      type="button"
                      onClick={() => {
                        void rejectSkill({
                          variables: { skillId: skill._id },
                        }).then(() => refresh());
                      }}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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

        <div style={{ margin: "1rem 0" }}>
          <Checkbox
            label="Include pending in catalog query"
            checked={includePending}
            onChange={(_event, field) =>
              setIncludePending(Boolean(field.checked))
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
            ) : (
              catalog.map((skill) => (
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
