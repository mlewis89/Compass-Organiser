"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import reducer, { type CompassAction, type CompassState } from "@/lib/client/reducers";

const CompassContext = createContext<[CompassState, Dispatch<CompassAction>] | null>(
  null,
);

export const useCompassContext = () => {
  const value = useContext(CompassContext);
  if (!value) {
    throw new Error("useCompassContext must be used within CompassProvider");
  }
  return value;
};

const initialState: CompassState = {
  activeEventId: "",
  skills: [],
  TimeAvailable: "",
  reRenderMyTasks: false,
};

export function CompassProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <CompassContext.Provider value={[state, dispatch]}>
      {children}
    </CompassContext.Provider>
  );
}
