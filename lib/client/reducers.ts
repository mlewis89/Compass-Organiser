import type { Skill } from "@/lib/client/types";
import {
  ADD_SKILLS,
  REMOVE_SKILLS,
  UPDATE_ACTIVE_EVENT,
  UPDATE_RERENDER_MYTASKS,
  UPDATE_SKILLS,
  UPDATE_TIME_AVAILABLE,
} from "@/lib/client/actions";

export type CompassState = {
  activeEventId: string;
  skills: Skill[];
  TimeAvailable: number | "";
  reRenderMyTasks: boolean;
};

export type CompassAction =
  | { type: typeof UPDATE_ACTIVE_EVENT; payload: string }
  | { type: typeof UPDATE_TIME_AVAILABLE; payload: string | number }
  | { type: typeof ADD_SKILLS; payload: string }
  | { type: typeof REMOVE_SKILLS; payload: string }
  | { type: typeof UPDATE_SKILLS; payload: Skill[] }
  | { type: typeof UPDATE_RERENDER_MYTASKS; payload: boolean };

export default function reducer(
  state: CompassState,
  action: CompassAction,
): CompassState {
  switch (action.type) {
    case UPDATE_ACTIVE_EVENT:
      return { ...state, activeEventId: action.payload };
    case UPDATE_TIME_AVAILABLE:
      return { ...state, TimeAvailable: parseInt(String(action.payload), 10) };
    case ADD_SKILLS: {
      const index = state.skills.findIndex((skill) => skill._id === action.payload);
      if (index < 0) {
        return state;
      }
      const next = [...state.skills];
      next[index] = { ...next[index], isActiveForUser: true };
      return { ...state, skills: next };
    }
    case REMOVE_SKILLS: {
      const index = state.skills.findIndex((skill) => skill._id === action.payload);
      if (index < 0) {
        return state;
      }
      const next = [...state.skills];
      next[index] = { ...next[index], isActiveForUser: false };
      return { ...state, skills: next };
    }
    case UPDATE_SKILLS:
      return { ...state, skills: action.payload };
    case UPDATE_RERENDER_MYTASKS:
      return { ...state, reRenderMyTasks: action.payload };
    default:
      return state;
  }
}
