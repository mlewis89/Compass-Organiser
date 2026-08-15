"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Checkbox,
  Input,
  Label,
  Message,
  Segment,
} from "semantic-ui-react";
import { QUERY_USER_SKILLS } from "@/lib/client/queries";
import { CREATE_SKILL } from "@/lib/client/mutations";
import type { Skill } from "@/lib/client/types";
import {
  buildSkillTree,
  filterSkillsByQuery,
  flattenSkillTree,
} from "@/lib/client/skillTree";

type Mode = "task" | "possession";

type Props = {
  mode: Mode;
  selectedIds: string[];
  onChange: (skills: Skill[]) => void;
  disabled?: boolean;
  allowCreate?: boolean;
};

export default function SkillPicker({
  mode,
  selectedIds,
  onChange,
  disabled = false,
  allowCreate = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [createParentId, setCreateParentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { data, refetch } = useQuery<{ pageSkills: Skill[] }>(QUERY_USER_SKILLS, {
    fetchPolicy: "cache-and-network",
  });
  const [createSkill, { loading: creating }] = useMutation(CREATE_SKILL, {
    refetchQueries: [{ query: QUERY_USER_SKILLS }],
  });

  const catalog = data?.pageSkills ?? [];
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedSkills = catalog.filter((skill) => selectedSet.has(skill._id));

  const filtered = filterSkillsByQuery(catalog, query);
  const tree = buildSkillTree(filtered);
  const flat = flattenSkillTree(tree);
  const parentOptions = catalog.filter((skill) => !skill.parentId);

  const createName = query.trim();
  const exactMatch = catalog.some(
    (skill) => (skill.name ?? "").toLowerCase() === createName.toLowerCase(),
  );
  const showCreate =
    allowCreate && !disabled && createName.length > 0 && !exactMatch;

  const toggleSkill = (skill: Skill, checked: boolean) => {
    if (disabled) {
      return;
    }
    if (checked) {
      const next = [
        ...selectedSkills.filter((s) => s._id !== skill._id),
        skill,
      ];
      onChange(next);
    } else {
      onChange(selectedSkills.filter((s) => s._id !== skill._id));
    }
  };

  const handleCreate = async () => {
    const name = createName;
    if (!name) {
      setError("Enter a skill name to create");
      return;
    }
    setError(null);
    try {
      const result = await createSkill({
        variables: {
          skill: {
            name,
            parentId: createParentId || undefined,
          },
        },
      });
      const created = result.data?.createSkill as Skill | undefined;
      await refetch();
      if (created) {
        onChange([
          ...selectedSkills.filter((s) => s._id !== created._id),
          created,
        ]);
      }
      setCreateParentId("");
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create skill");
    }
  };

  return (
    <div>
      {mode === "task" && selectedSkills.length > 0 ? (
        <div style={{ marginBottom: "0.75rem" }}>
          {selectedSkills.map((skill) => (
            <Label key={skill._id} style={{ marginBottom: "0.35rem" }}>
              {skill.name}
              {!disabled ? (
                <Label.Detail
                  as="a"
                  onClick={() => toggleSkill(skill, false)}
                  style={{ cursor: "pointer" }}
                >
                  ×
                </Label.Detail>
              ) : null}
            </Label>
          ))}
        </div>
      ) : null}

      <Input
        icon="search"
        placeholder="Search skills…"
        value={query}
        onChange={(
          _event: React.ChangeEvent<HTMLInputElement>,
          data: { value?: string },
        ) => setQuery(data.value ?? "")}
        disabled={disabled}
      />

      <Segment
        style={{
          maxHeight: 240,
          overflowY: "auto",
          marginTop: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        {flat.length === 0 ? (
          showCreate ? null : (
            <p style={{ color: "#666", margin: 0 }}>
              No skills match this search.
            </p>
          )
        ) : (
          flat.map((skill) => {
            const depth = skill.parentId ? 1 : 0;
            return (
              <div
                key={skill._id}
                style={{
                  paddingLeft: depth * 1.25 + "rem",
                  marginBottom: "0.35rem",
                }}
              >
                <Checkbox
                  label={skill.name}
                  checked={selectedSet.has(skill._id)}
                  disabled={disabled}
                  onChange={(_event, data) =>
                    toggleSkill(skill, Boolean(data.checked))
                  }
                />
                {skill.scope === "group" ? (
                  <Label
                    size="mini"
                    basic
                    as="span"
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Group
                  </Label>
                ) : null}
              </div>
            );
          })
        )}

        {showCreate ? (
          <div
            style={{
              marginTop: flat.length > 0 ? "0.75rem" : 0,
              paddingTop: flat.length > 0 ? "0.75rem" : 0,
              borderTop: flat.length > 0 ? "1px solid rgba(34, 36, 38, 0.15)" : undefined,
            }}
          >
            <Button
              type="button"
              size="small"
              loading={creating}
              onClick={() => {
                void handleCreate();
              }}
            >
              {`Create “${createName}” & select`}
            </Button>
            <div style={{ marginTop: "0.5rem" }}>
              <label
                htmlFor="skill-picker-parent"
                style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9em" }}
              >
                Optional parent (subset of)
              </label>
              <select
                id="skill-picker-parent"
                value={createParentId}
                onChange={(event) => setCreateParentId(event.target.value)}
                style={{ maxWidth: "100%" }}
              >
                <option value="">None</option>
                {parentOptions.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </Segment>

      {error ? <Message negative content={error} /> : null}
    </div>
  );
}
