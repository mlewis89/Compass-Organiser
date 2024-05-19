// Import our actions from our actions file
import {
  UPDATE_ACTIVE_EVENT,
  UPDATE_TIME_AVAILABLE,
  ADD_SKILLS,
  REMOVE_SKILLS,
  UPDATE_SKILLS,
  UPDATE_RERENDER_MYTASKS,
  UPDATE_MY_TASKS
} from "./actions";

// Create a function that will handle combining two objects. Accepts state and an action as an argument.
export default function reducer(state, action) {
  // Depending on the action we create a new version of state after the desired action is preformed
  console.log(action.type)
  switch (action.type) {
    case UPDATE_ACTIVE_EVENT:
      return { ...state, activeEventId: action.payload };
    case UPDATE_TIME_AVAILABLE:
      return { ...state, TimeAvailable: parseInt(action.payload) };
    case ADD_SKILLS: {
      let skills = [...state.skills];
      let index = skills.findIndex((x) => x._id == action.payload);
      if (index >= 0) {
        let tempObject = { ...skills[index], isActiveForUser: true };
        let newSkills = [...skills];
        newSkills[index] = tempObject;

        return { ...state, skills: newSkills };
      }
      return { ...state };
    }
    case REMOVE_SKILLS: {
      let skills = [...state.skills];
      let index = skills.findIndex((x) => x._id == action.payload);
      if (index >= 0) {
        let tempObject = { ...skills[index], isActiveForUser: false };
        let newSkills = [...skills];
        newSkills[index] = tempObject;
        return { ...state, skills: newSkills };
      }
      return { ...state };
    }
    case UPDATE_SKILLS: {
      return { ...state, skills: action.payload };
    }
    case  UPDATE_RERENDER_MYTASKS:{
      return {...state,  reRenderMyTasks: action.payload};
    }
    case UPDATE_MY_TASKS: {
      return {...state, myTasks: action.payload};
    }
    default:
      return state;
  }
}
