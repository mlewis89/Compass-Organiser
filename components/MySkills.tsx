"use client";

import { useMutation, useQuery } from "@apollo/client";
import { Button, Icon, Label, Segment } from "semantic-ui-react";
import { QUERY_USER_SKILLS } from "@/lib/client/queries";
import { ASSIGN_USER_SKILLS, REMOVE_USER_SKILLS } from "@/lib/client/mutations";
import { useCompassContext } from "@/lib/client/CompassContext";
import { ADD_SKILLS, REMOVE_SKILLS, UPDATE_SKILLS } from "@/lib/client/actions";
import type { Skill } from "@/lib/client/types";

export default function MySkills() {
  const [state, dispatch] = useCompassContext();
  useQuery<{ pageSkills: Skill[] }>(QUERY_USER_SKILLS, {
    onCompleted: (result) => {
      dispatch({ type: UPDATE_SKILLS, payload: result.pageSkills });
    },
  });
  const [addUserSkill] = useMutation(ASSIGN_USER_SKILLS);
  const [removeUserSkill] = useMutation(REMOVE_USER_SKILLS);

  const mySkills = state.skills.filter((skill) => skill.isActiveForUser);
  const otherSkills = state.skills.filter((skill) => !skill.isActiveForUser);

  return (
    <Segment padded>
      <Label attached="top">Skills</Label>
      <Segment>
        <Label attached="top">My Skills</Label>
        {mySkills.map((skill) => (
          <Button
            icon
            labelPosition="right"
            key={skill._id}
            onClick={() => {
              void removeUserSkill({ variables: { skillId: skill._id } });
              dispatch({ type: REMOVE_SKILLS, payload: skill._id });
            }}
          >
            {skill.name}
            <Icon name="delete" />
          </Button>
        ))}
      </Segment>
      <Segment>
        <Label attached="top">Other Skills</Label>
        {otherSkills.map((skill) => (
          <Button
            icon
            labelPosition="right"
            key={skill._id}
            onClick={() => {
              void addUserSkill({ variables: { skillId: skill._id } });
              dispatch({ type: ADD_SKILLS, payload: skill._id });
            }}
          >
            {skill.name}
            <Icon name="add circle" />
          </Button>
        ))}
      </Segment>
    </Segment>
  );
}
