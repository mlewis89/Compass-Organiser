import { createContext, useContext, useReducer } from "react";
import reducer from "./reducers";
import SuggestedTasks from "../components/SuggestedTasks";

const CompassContext = createContext(); //create context
export const useCompassContext = () => useContext(CompassContext); //creat hook for easy access

export const CompassProvider = ({ children }) => {
//    const activeEventId = "664543dc5bbfb57230c84c17"
    const activeEventId = "";
    const skills =[];
    const TimeAvailable = "";
    const reRenderMyTasks = false;
    const allTasks = [];
    const suggestedTasks = [];
    const myTasks = [];
    


  const [state, dispatch] = useReducer(reducer, { activeEventId, skills , TimeAvailable, reRenderMyTasks, allTasks, suggestedTasks, myTasks});

  return (
    <CompassContext.Provider value={[state, dispatch]}>
      {/* Render children passed from props */}
      {children}
    </CompassContext.Provider>
  );
};
