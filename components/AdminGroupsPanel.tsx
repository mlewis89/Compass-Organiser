"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import {
  Button,
  Form,
  FormField,
  Input,
  Label,
  Message,
  Segment,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import {
  QUERY_ADMIN_GROUP_MEMBERS,
  QUERY_ADMIN_GROUPS,
  QUERY_ORPHANED_USERS,
  QUERY_ROLES,
} from "@/lib/client/queries";
import {
  ASSIGN_USER_TO_GROUP,
  CREATE_GROUP,
  REMOVE_USER_FROM_GROUP,
  UPDATE_GROUP,
} from "@/lib/client/mutations";
import type { AdminGroup, Member, Role } from "@/lib/client/types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminGroupsPanel() {
  const { data: groupsData, refetch: refetchGroups } = useQuery<{
    adminGroups: AdminGroup[];
  }>(QUERY_ADMIN_GROUPS);
  const { data: orphansData, refetch: refetchOrphans } = useQuery<{
    orphanedUsers: Member[];
  }>(QUERY_ORPHANED_USERS);
  const { data: rolesData } = useQuery<{ roles: Role[] }>(QUERY_ROLES);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoleIds, setAssignRoleIds] = useState<string[]>([]);
  const [orphanAssignGroupId, setOrphanAssignGroupId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = groupsData?.adminGroups ?? [];
  const orphans = orphansData?.orphanedUsers ?? [];
  const selectedGroup =
    groups.find((group) => group._id === selectedGroupId) ?? groups[0] ?? null;
  const activeGroupId = selectedGroup?._id ?? null;

  const { data: membersData, refetch: refetchMembers } = useQuery<{
    adminGroupMembers: Member[];
  }>(QUERY_ADMIN_GROUP_MEMBERS, {
    variables: { groupId: activeGroupId },
    skip: !activeGroupId,
  });

  const [createGroup, { loading: creating }] = useMutation(CREATE_GROUP);
  const [updateGroup, { loading: updating }] = useMutation(UPDATE_GROUP);
  const [assignUser, { loading: assigning }] = useMutation(ASSIGN_USER_TO_GROUP);
  const [removeUser, { loading: removing }] = useMutation(REMOVE_USER_FROM_GROUP);

  const roleOptions = useMemo(
    () =>
      (rolesData?.roles ?? []).map((role) => ({
        text: role.name ?? "",
        value: role._id,
      })),
    [rolesData],
  );

  const orphanOptions = useMemo(
    () =>
      orphans.map((user) => ({
        text: `${user.displayName || user.email} (${user.email})`,
        value: user._id,
      })),
    [orphans],
  );

  const groupOptions = useMemo(
    () =>
      groups
        .filter((group) => group.status === "active")
        .map((group) => ({
          text: group.name,
          value: group._id,
        })),
    [groups],
  );

  const clearFlash = () => {
    setMessage(null);
    setError(null);
  };

  const refreshAll = async () => {
    await Promise.all([
      refetchGroups(),
      refetchOrphans(),
      activeGroupId ? refetchMembers() : Promise.resolve(),
    ]);
  };

  return (
    <>
      {message ? <Message positive onDismiss={clearFlash}>{message}</Message> : null}
      {error ? <Message negative onDismiss={clearFlash}>{error}</Message> : null}

      <Segment padded>
        <Label attached="top">Create group</Label>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            clearFlash();
            void createGroup({
              variables: {
                group: {
                  name: newName,
                  slug: newSlug || slugify(newName),
                },
              },
            })
              .then(async (result) => {
                setNewName("");
                setNewSlug("");
                setMessage(`Created ${result.data?.createGroup?.name}`);
                await refreshAll();
                if (result.data?.createGroup?._id) {
                  setSelectedGroupId(result.data.createGroup._id);
                }
              })
              .catch((err: Error) => setError(err.message));
          }}
        >
          <FormField
            control={Input}
            label="Name"
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNewName(e.target.value);
              if (!newSlug || newSlug === slugify(newName)) {
                setNewSlug(slugify(e.target.value));
              }
            }}
            required
          />
          <FormField
            control={Input}
            label="Slug"
            value={newSlug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewSlug(slugify(e.target.value))
            }
            required
          />
          <Button type="submit" primary loading={creating}>
            Create group
          </Button>
        </Form>
      </Segment>

      <Segment padded>
        <Label attached="top">Groups</Label>
        <Table celled selectable striped>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Slug</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Members</TableHeaderCell>
              <TableHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow
                key={group._id}
                active={group._id === activeGroupId}
                onClick={() => setSelectedGroupId(group._id)}
              >
                <TableCell>{group.name}</TableCell>
                <TableCell>{group.slug}</TableCell>
                <TableCell>{group.status}</TableCell>
                <TableCell>{group.memberCount}</TableCell>
                <TableCell>
                  <Button
                    size="tiny"
                    loading={updating}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      clearFlash();
                      void updateGroup({
                        variables: {
                          groupId: group._id,
                          group: {
                            status:
                              group.status === "active" ? "inactive" : "active",
                          },
                        },
                      })
                        .then(async () => {
                          setMessage(
                            `${group.name} marked ${
                              group.status === "active" ? "inactive" : "active"
                            }`,
                          );
                          await refreshAll();
                        })
                        .catch((err: Error) => setError(err.message));
                    }}
                  >
                    {group.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Segment>

      {selectedGroup ? (
        <Segment padded>
          <Label attached="top">
            Members — {selectedGroup.name}
          </Label>
          <Table celled striped>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Account</TableHeaderCell>
                <TableHeaderCell>Roles</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(membersData?.adminGroupMembers ?? []).map((member) => (
                <TableRow key={member._id}>
                  <TableCell>{member.displayName}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.accountStatus}</TableCell>
                  <TableCell>
                    {(member.role ?? []).map((role) => role.name).join(", ")}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="tiny"
                      negative
                      loading={removing}
                      onClick={() => {
                        clearFlash();
                        void removeUser({
                          variables: {
                            userId: member._id,
                            groupId: selectedGroup._id,
                          },
                        })
                          .then(async () => {
                            setMessage(`Removed ${member.email} from group`);
                            await refreshAll();
                          })
                          .catch((err: Error) => setError(err.message));
                      }}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Form
            style={{ marginTop: "1em" }}
            onSubmit={(event) => {
              event.preventDefault();
              if (!assignUserId) {
                return;
              }
              clearFlash();
              void assignUser({
                variables: {
                  userId: assignUserId,
                  groupId: selectedGroup._id,
                  roleIds: assignRoleIds,
                },
              })
                .then(async () => {
                  setAssignUserId("");
                  setAssignRoleIds([]);
                  setMessage("User assigned to group");
                  await refreshAll();
                })
                .catch((err: Error) => setError(err.message));
            }}
          >
            <FormField
              control={Select}
              label="Assign orphaned user"
              placeholder="Select user"
              options={orphanOptions}
              value={assignUserId || undefined}
              onChange={(_e: unknown, data: { value?: string }) =>
                setAssignUserId(String(data.value ?? ""))
              }
              search
            />
            <FormField
              control={Select}
              label="Roles (optional)"
              multiple
              options={roleOptions}
              value={assignRoleIds}
              onChange={(_e: unknown, data: { value?: string[] }) =>
                setAssignRoleIds(data.value ?? [])
              }
            />
            <Button type="submit" primary loading={assigning} disabled={!assignUserId}>
              Assign to this group
            </Button>
          </Form>
        </Segment>
      ) : null}

      <Segment padded>
        <Label attached="top">Orphaned users</Label>
        <p>
          Users with no active group membership. Assign them to a group to get
          them into the app.
        </p>
        <Table celled striped>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Account</TableHeaderCell>
              <TableHeaderCell>Assign</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orphans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No orphaned users</TableCell>
              </TableRow>
            ) : (
              orphans.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.accountStatus}</TableCell>
                  <TableCell>
                    <Form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!orphanAssignGroupId) {
                          setError("Pick a group first");
                          return;
                        }
                        clearFlash();
                        void assignUser({
                          variables: {
                            userId: user._id,
                            groupId: orphanAssignGroupId,
                            roleIds: [],
                          },
                        })
                          .then(async () => {
                            setMessage(`Assigned ${user.email}`);
                            await refreshAll();
                          })
                          .catch((err: Error) => setError(err.message));
                      }}
                    >
                      <FormField
                        control={Select}
                        placeholder="Group"
                        options={groupOptions}
                        value={orphanAssignGroupId || undefined}
                        onChange={(_e: unknown, data: { value?: string }) =>
                          setOrphanAssignGroupId(String(data.value ?? ""))
                        }
                      />
                      <Button type="submit" size="tiny" primary loading={assigning}>
                        Assign
                      </Button>
                    </Form>
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
