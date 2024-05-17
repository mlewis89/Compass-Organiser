import { createContext, useContext, useReducer } from "react";
import reducer from "./reducers";

const CompassContext = createContext(); //create context
export const useCompassContext = () => useContext(CompassContext); //creat hook for easy access

export const CompassProvider = ({ children }) => {
//    const activeEventId = "664543dc5bbfb57230c84c17"
    const activeEventId = "";
    const skills =[];
    const TimeAvailable = "";
    const reRenderMyTasks = false;
    


  const [state, dispatch] = useReducer(reducer, { activeEventId, skills , TimeAvailable, reRenderMyTasks});

  return (
    <CompassContext.Provider value={[state, dispatch]}>
      {/* Render children passed from props */}
      {children}
    </CompassContext.Provider>
  );
};
