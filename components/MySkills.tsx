"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  Button,
  Icon,
  Label,
  Message,
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  Segment,
} from "semantic-ui-react";
import { QUERY_USER_SKILLS } from "@/lib/client/queries";
import { ASSIGN_USER_SKILLS, REMOVE_USER_SKILLS } from "@/lib/client/mutations";
import { useCompassContext } from "@/lib/client/CompassContext";
import { UPDATE_SKILLS } from "@/lib/client/actions";
import type { Skill } from "@/lib/client/types";
import SkillPicker from "@/components/SkillPicker";

function withActiveIds(skills: Skill[], activeIds: Set<string>): Skill[] {
  return skills.map((skill) => ({
    ...skill,
    isActiveForUser: activeIds.has(skill._id),
  }));
}

export default function MySkills() {
  const [state, dispatch] = useCompassContext();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, refetch } = useQuery<{ pageSkills: Skill[] }>(QUERY_USER_SKILLS, {
    fetchPolicy: "cache-and-network",
  });
  const [addUserSkill] = useMutation(ASSIGN_USER_SKILLS);
  const [removeUserSkill] = useMutation(REMOVE_USER_SKILLS);

  useEffect(() => {
    if (data?.pageSkills) {
      dispatch({ type: UPDATE_SKILLS, payload: data.pageSkills });
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (addOpen) {
      void refetch();
    }
  }, [addOpen, refetch]);

  const mySkills = state.skills.filter((skill) => skill.isActiveForUser);
  const selectedIds = mySkills.map((skill) => skill._id);

  const handleToggle = async (nextSkills: Skill[]) => {
    setError(null);
    const nextIds = new Set(nextSkills.map((skill) => skill._id).filter(Boolean));
    const currentIds = new Set(selectedIds);

    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));
    if (toAdd.length === 0 && toRemove.length === 0) {
      return;
    }

    const byId = new Map(
      [...(data?.pageSkills ?? state.skills), ...nextSkills].map((skill) => [
        skill._id,
        skill,
      ]),
    );
    dispatch({
      type: UPDATE_SKILLS,
      payload: withActiveIds([...byId.values()], nextIds),
    });

    try {
      for (const skillId of toAdd) {
        await addUserSkill({ variables: { skillId } });
      }
      for (const skillId of toRemove) {
        await removeUserSkill({ variables: { skillId } });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update skills",
      );
    }

    const refreshed = await refetch();
    if (refreshed.data?.pageSkills) {
      dispatch({ type: UPDATE_SKILLS, payload: refreshed.data.pageSkills });
    }
  };

  const removeChip = (skillId: string) => {
    void handleToggle(mySkills.filter((skill) => skill._id !== skillId));
  };

  return (
    <Segment padded>
      <Label attached="top">My Skills</Label>
      {mySkills.length === 0 ? (
        <p style={{ color: "#666" }}>
          No skills yet — add what you can help with.
        </p>
      ) : (
        <div
          style={{
            marginBottom: "0.75rem",
            maxHeight: 120,
            overflowY: "auto",
          }}
        >
          {mySkills.map((skill) => (
            <Button
              icon
              labelPosition="right"
              key={skill._id}
              size="mini"
              style={{ marginBottom: "0.25rem" }}
              onClick={() => removeChip(skill._id)}
            >
              {skill.name}
              <Icon name="delete" />
            </Button>
          ))}
        </div>
      )}
      <Button type="button" primary onClick={() => setAddOpen(true)}>
        Add skills
      </Button>
      {error ? (
        <Message negative content={error} style={{ marginTop: "0.75rem" }} />
      ) : null}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} size="small">
        <ModalHeader>Add skills</ModalHeader>
        <ModalContent>
          <p>
            Search the catalog or browse the full list. Check skills you have;
            uncheck to remove.
          </p>
          {addOpen ? (
            <SkillPicker
              mode="possession"
              selectedIds={selectedIds}
              onChange={(skills) => {
                void handleToggle(skills);
              }}
              allowCreate={false}
            />
          ) : null}
        </ModalContent>
        <ModalActions>
          <Button type="button" onClick={() => setAddOpen(false)}>
            Done
          </Button>
        </ModalActions>
      </Modal>
    </Segment>
  );
}
