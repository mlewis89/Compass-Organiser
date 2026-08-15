"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
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
import { QUERY_MEMBERS, QUERY_UNITS } from "@/lib/client/queries";
import {
  ADD_UNIT,
  DELETE_UNIT,
  SET_UNIT_MEMBERS,
  UPDATE_UNIT,
} from "@/lib/client/mutations";
import type { Member, UnitSummary } from "@/lib/client/types";
import ConfirmDialog from "@/components/ConfirmDialog";

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

export default function UnitsPanel() {
  const [newName, setNewName] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, loading, refetch } = useQuery<{ units: UnitSummary[] }>(QUERY_UNITS);
  const { data: membersData } = useQuery<{ members: Member[] }>(QUERY_MEMBERS);
  const units = data?.units ?? [];
  const selectedUnit = units.find((unit) => unit._id === selectedUnitId) ?? null;

  const [addUnit, { loading: creating }] = useMutation(ADD_UNIT, {
    refetchQueries: [{ query: QUERY_UNITS }],
  });
  const [updateUnit, { loading: renaming }] = useMutation(UPDATE_UNIT, {
    refetchQueries: [{ query: QUERY_UNITS }],
  });
  const [setUnitMembers, { loading: savingMembers }] = useMutation(SET_UNIT_MEMBERS, {
    refetchQueries: [{ query: QUERY_UNITS }],
  });
  const [deleteUnit, { loading: deleting }] = useMutation(DELETE_UNIT, {
    refetchQueries: [{ query: QUERY_UNITS }],
  });

  useEffect(() => {
    if (!selectedUnit) {
      setEditName("");
      setMemberIds([]);
      return;
    }
    setEditName(selectedUnit.name);
    setMemberIds((selectedUnit.members ?? []).map((member) => member._id));
  }, [selectedUnit]);

  const memberOptions = useMemo(() => {
    const members = membersData?.members ?? [];
    const options = members.map((member) => ({
      key: member._id,
      value: member._id,
      text: memberLabel(member),
    }));
    for (const member of selectedUnit?.members ?? []) {
      if (member._id && !options.some((option) => option.value === member._id)) {
        options.unshift({
          key: member._id,
          value: member._id,
          text: member.displayName?.trim() || "Current member",
        });
      }
    }
    return options;
  }, [membersData?.members, selectedUnit?.members]);

  const handleCreate = async () => {
    setError(null);
    setMessage(null);
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }
    try {
      const result = await addUnit({
        variables: { unit: { name: newName.trim() } },
      });
      const createdId = result.data?.addUnit?._id;
      setNewName("");
      setMessage("Unit created");
      if (createdId) {
        setSelectedUnitId(createdId);
      }
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create unit");
    }
  };

  const handleRename = async () => {
    if (!selectedUnit) {
      return;
    }
    setError(null);
    setMessage(null);
    if (!editName.trim()) {
      setError("Name is required");
      return;
    }
    try {
      await updateUnit({
        variables: {
          unitId: selectedUnit._id,
          unit: { name: editName.trim() },
        },
      });
      setMessage("Unit renamed");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename unit");
    }
  };

  const handleSaveMembers = async () => {
    if (!selectedUnit) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await setUnitMembers({
        variables: { unitId: selectedUnit._id, userIds: memberIds },
      });
      setMessage("Unit members saved");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save members");
    }
  };

  const handleDelete = async () => {
    if (!selectedUnit) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await deleteUnit({ variables: { unitId: selectedUnit._id } });
      setSelectedUnitId(null);
      setDeleteOpen(false);
      setMessage("Unit deleted");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete unit");
    }
  };

  return (
    <Segment padded>
      <Header as="h3">Units</Header>
      <p>
        Units are named teams inside this group. Assign members here, then pick a
        unit on a task so everyone in it sees that task in My Tasks.
      </p>
      {message ? <Message positive content={message} /> : null}
      {error ? <Message negative content={error} /> : null}

      <Form
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <FormField>
          <label>New unit</label>
          <Input
            placeholder="e.g. Quarries, Cub leaders, Camp crew"
            value={newName}
            onChange={(_event, data) => setNewName(String(data.value ?? ""))}
            action={{
              primary: true,
              content: "Create",
              loading: creating,
              disabled: creating,
              onClick: () => {
                void handleCreate();
              },
            }}
          />
        </FormField>
      </Form>

      <Table celled selectable>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Members</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={2}>Loading…</TableCell>
            </TableRow>
          ) : units.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2}>No units yet.</TableCell>
            </TableRow>
          ) : (
            units.map((unit) => (
              <TableRow
                key={unit._id}
                active={unit._id === selectedUnitId}
                onClick={() => setSelectedUnitId(unit._id)}
              >
                <TableCell>{unit.name}</TableCell>
                <TableCell>
                  {(unit.members ?? []).length === 0
                    ? "—"
                    : (unit.members ?? [])
                        .map((member) => member.displayName)
                        .filter(Boolean)
                        .join(", ")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedUnit ? (
        <Segment>
          <Header as="h4">Edit {selectedUnit.name}</Header>
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              void handleRename();
            }}
          >
            <FormField>
              <label>Name</label>
              <Input
                value={editName}
                onChange={(_event, data) => setEditName(String(data.value ?? ""))}
                action={{
                  content: "Rename",
                  loading: renaming,
                  disabled: renaming,
                  onClick: () => {
                    void handleRename();
                  },
                }}
              />
            </FormField>
            <FormField>
              <label>Members</label>
              <Dropdown
                placeholder="Search members…"
                fluid
                multiple
                search
                selection
                options={memberOptions}
                value={memberIds}
                onChange={(_event, dropdownData) => {
                  const selectedIds = Array.isArray(dropdownData.value)
                    ? dropdownData.value.map(String)
                    : [];
                  setMemberIds(selectedIds);
                }}
              />
            </FormField>
            <Button
              type="button"
              primary
              loading={savingMembers}
              disabled={savingMembers}
              onClick={() => {
                void handleSaveMembers();
              }}
            >
              Save members
            </Button>
            <Button
              type="button"
              negative
              loading={deleting}
              disabled={deleting}
              onClick={() => setDeleteOpen(true)}
            >
              Delete unit
            </Button>
          </Form>
        </Segment>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        header="Confirm Delete"
        message={`Are you sure you want to delete the ${selectedUnit?.name ?? ""} unit? Tasks assigned to it will lose this unit.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </Segment>
  );
}
