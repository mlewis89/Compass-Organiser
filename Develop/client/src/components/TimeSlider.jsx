import { Segment, Label } from "semantic-ui-react";
import { useState } from "react";
import { QUERY_ME_TIME } from "../utils/queries";
import { UPDATE_ME_TIME } from "../utils/mutations";
import { useQuery, useMutation } from "@apollo/client";import 


{ useCompassContext } from "../utils/CompassContext";
import { UPDATE_TIME_AVAILABLE } from "../utils/actions";

const TimeSlider = () => {
const [state, dispatch] = useCompassContext()


  const { loading, data } = useQuery(QUERY_ME_TIME);

  //const [TimeAvailable, setTimeAvailable] = useState();
  const [saveUserTime, { error }] = useMutation(UPDATE_ME_TIME);

  const handleSliderMove = (event) => {
    event.preventDefault();
    dispatch({ type: UPDATE_TIME_AVAILABLE, payload: event.target.value })
    saveUserTime({
      variables: { taskAvailabity: parseInt(event.target.value) },
    });
  };

  if (loading) {
    return <></>;
  } else {
    dispatch({ type: UPDATE_TIME_AVAILABLE, payload: data.me.taskAvailabity });
    return (
      <Segment padded>
        <Label attached="top">My Time Availabilty</Label>

        <input
          type="range"
          min="0"
          max="10"
          step="1"
          name="timeavalable"
          value={state.TimeAvailable}
          onChange={handleSliderMove}
          className="timeSlider"
        />
        {state.TimeAvailable}
      </Segment>
    );
  }
};

export default TimeSlider;
