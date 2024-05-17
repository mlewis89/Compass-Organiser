import { createContext, useContext, useReducer } from "react";
import reducer from "./reducers";

const CompassContext = createContext(); //create context
export const useCompassContext = () => useContext(CompassContext); //creat hook for easy access

export const CompassProvider = ({ children }) => {
//    const activeEventId = "664543dc5bbfb57230c84c17"
    const activeEventId = "";
    let skills =[];
    let TimeAvailable = "";


  const [state, dispatch] = useReducer(reducer, { activeEventId, skills , TimeAvailable});

  return (
    <CompassContext.Provider value={[state, dispatch]}>
      {/* Render children passed from props */}
      {children}
    </CompassContext.Provider>
  );
};
