import { Segment, Label, Icon, Button } from "semantic-ui-react";
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_USER_SKILLS } from "../utils/queries";
import { ASSIGN_USER_SKILLS, REMOVE_USER_SKILLS } from "../utils/mutations";

const MySkills = () => {
  const { loading, data } = useQuery(QUERY_USER_SKILLS, {
    onCompleted: () => {
      let skillData = [...data.pageSkills];
      setSkills(skillData);
    },
  });
  const [addUserSkill, { adderror }] = useMutation(ASSIGN_USER_SKILLS);
  const [RemoveUserSkill, { removererror }] = useMutation(REMOVE_USER_SKILLS);
  const [skills, setSkills] = useState([]);

  const handleSkillAdd = async (event, data) => {
    let _id = data["data-key"];
    //mutation to add _id to users Skills - returns skill object
    addUserSkill({ variables: { skillId: _id } });

    let index = skills.findIndex((x) => x._id == _id);
    if (index >= 0) {
      var tempObject = { ...skills[index], isActiveForUser: true };
      let newSkills = [...skills];
      newSkills[index] = tempObject;
      setSkills(newSkills);
    }
  };

  const handleSkillRemove = async (event, data) => {
    let _id = data["data-key"];
    RemoveUserSkill({ variables: { skillId: _id } });
    let index = skills.findIndex((x) => x._id == _id);
    if (index >= 0) {
      var tempObject = { ...skills[index], isActiveForUser: false };
      let newSkills = [...skills];
      newSkills[index] = tempObject;
      setSkills(newSkills);
    }
  };

  console.log(skills);

  if (!loading) {
    let mySkills = skills.filter((skill) => skill.isActiveForUser);
    let otherSkills = skills.filter((skill) => !skill.isActiveForUser);

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
              onClick={handleSkillRemove}
              data-key={skill._id}
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
              onClick={handleSkillAdd}
              data-key={skill._id}
            >
              {skill.name}
              <Icon name="add circle" />
            </Button>
          ))}
        </Segment>
      </Segment>
    );
  } else {
    return <p>Loading</p>;
  }
};

export default MySkills;
