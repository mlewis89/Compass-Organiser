import { Segment, Label, Icon, Button } from "semantic-ui-react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_USER_SKILLS } from "../utils/queries";
import { ASSIGN_USER_SKILLS, REMOVE_USER_SKILLS } from "../utils/mutations";

import { useCompassContext } from "../utils/CompassContext";
import { ADD_SKILLS, REMOVE_SKILLS, UPDATE_SKILLS } from "../utils/actions";

const MySkills = () => {
  const [state, dispatch] = useCompassContext();

  const { loading, data } = useQuery(QUERY_USER_SKILLS
    ,{onCompleted: ()=>dispatch({ type: UPDATE_SKILLS, payload: [...data.pageSkills] })  }
  );

  const [addUserSkill, { adderror }] = useMutation(ASSIGN_USER_SKILLS);
  const [RemoveUserSkill, { removererror }] = useMutation(REMOVE_USER_SKILLS);
  //const [skills, setSkills] = useState([]);

  const handleSkillAdd = async (event, data) => {
    let _id = data["data-key"];
    //mutation to add _id to users Skills - returns skill object
    addUserSkill({ variables: { skillId: _id } });
    dispatch({ type: ADD_SKILLS, payload: _id });
  };

  const handleSkillRemove = async (event, data) => {
    let _id = data["data-key"];
    RemoveUserSkill({ variables: { skillId: _id } });
    dispatch({ type: REMOVE_SKILLS, payload: _id });
  };

  if (state.skills) {
    let mySkills = state.skills.filter((skill) => skill.isActiveForUser);
    let otherSkills = state.skills.filter((skill) => !skill.isActiveForUser);

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
