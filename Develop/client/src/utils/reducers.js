// Import our actions from our actions file
import {
    UPDATE_ACTIVE_EVENT,
  } from './actions';

  
  // Create a function that will handle combining two objects. Accepts state and an action as an argument.
  export default function reducer(state, action) {
    // Depending on the action we create a new version of state after the desired action is preformed
    switch (action.type) {
        case UPDATE_ACTIVE_EVENT:
            return {...state,activeEventId: action.payload};


      default:
        return state;
    }
  }
  