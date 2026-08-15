"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
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
import { ADD_SKILLS, REMOVE_SKILLS, UPDATE_SKILLS } from "@/lib/client/actions";
import type { Skill } from "@/lib/client/types";
import SkillPicker from "@/components/SkillPicker";

export default function MySkills() {
  const [state, dispatch] = useCompassContext();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useQuery<{ pageSkills: Skill[] }>(QUERY_USER_SKILLS, {
    onCompleted: (result) => {
      dispatch({ type: UPDATE_SKILLS, payload: result.pageSkills });
    },
  });
  const [addUserSkill] = useMutation(ASSIGN_USER_SKILLS);
  const [removeUserSkill] = useMutation(REMOVE_USER_SKILLS);

  const mySkills = state.skills.filter((skill) => skill.isActiveForUser);
  const selectedIds = mySkills.map((skill) => skill._id);

  const handleToggle = async (nextSkills: Skill[]) => {
    setError(null);
    const nextIds = new Set(nextSkills.map((skill) => skill._id));
    const currentIds = new Set(selectedIds);

    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

    for (const skillId of toAdd) {
      dispatch({ type: ADD_SKILLS, payload: skillId });
      try {
        await addUserSkill({ variables: { skillId } });
      } catch (err) {
        dispatch({ type: REMOVE_SKILLS, payload: skillId });
        setError(err instanceof Error ? err.message : "Could not add skill");
      }
    }

    for (const skillId of toRemove) {
      dispatch({ type: REMOVE_SKILLS, payload: skillId });
      try {
        await removeUserSkill({ variables: { skillId } });
      } catch (err) {
        dispatch({ type: ADD_SKILLS, payload: skillId });
        setError(err instanceof Error ? err.message : "Could not remove skill");
      }
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
          <SkillPicker
            mode="possession"
            selectedIds={selectedIds}
            onChange={(skills) => {
              void handleToggle(skills);
            }}
            allowCreate={false}
          />
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
