import { createContext, useContext } from "react";

export const CompassContext = createContext(); //create context
export const useCompass = () => useContext(CompassContext); //creat hook for easy access

export default function CompassProvider(props) {
    const initialState = {
        currentEventId = ''
    };
    return (
        <CompassContext.Provider value={initialState}>
            {/* Render children passed from props */}
            {children}
        </CompassContext.Provider>);

};