import { Segment, Label, Icon, Button } from "semantic-ui-react";
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_USER_SKILLS } from "../utils/queries";
import { UPDATE_ME_SKILLS } from "../utils/mutations";

const MySkills = () => {
  const { loading, data } = useQuery(QUERY_USER_SKILLS, {
    onCompleted: () => {
      let skillData = [...data.pageSkills];
      //console.log(skillData);
      setSkills(skillData);
    },
  });
  const [addRemoverUserSkill, { error }] = useMutation(UPDATE_ME_SKILLS);
  const [skills, setSkills] = useState([]);

  const handleSkillAdd = async (event, data) => {
    let _id = data["data-key"];
    //mutation to add _id to users Skills - returns skill object
    addRemoverUserSkill({ variables: { type: "ADD", skillId: _id } });

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
    addRemoverUserSkill({ variables: { type: "REMOVE", skillId: _id } });
    let index = skills.findIndex((x) => x._id == _id);
    if (index >= 0) {
      var tempObject = { ...skills[index], isActiveForUser: false };
      let newSkills = [...skills];
      newSkills[index] = tempObject;
      setSkills(newSkills);
    }
  };

  if (!loading) {
    let mySkills = skills.filter((skill) => skill.isActiveForUser);
    let otherSkills = skills.filter((skill) => !skill.isActiveForUser);

    return (
      <>
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
      </>
    );
  } else {
    return <p>Loading</p>;
  }
};

export default MySkills;
