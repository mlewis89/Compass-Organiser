import { Segment, Label } from "semantic-ui-react";
import { useState } from "react";
import { QUERY_ME_TIME } from "../utils/queries";
import { UPDATE_ME_TIME } from "../utils/mutations";
import { useQuery, useMutation } from "@apollo/client";

const TimeSlider = () => {
  const { loading, data } = useQuery(QUERY_ME_TIME, {
    onCompleted: (data) => setTimeAvailable(data.me.taskAvailabity),
  });

  const [TimeAvailable, setTimeAvailable] = useState();
  const [saveUserTime, { error }] = useMutation(UPDATE_ME_TIME);

  const handleSliderMove = (event) => {
    event.preventDefault();
    setTimeAvailable(event.target.value);
    saveUserTime({
      variables: { taskAvailabity: parseInt(event.target.value) },
    });
  };

  if (loading) {
    return <></>;
  } else {
    return (
      <Segment padded>
        <Label attached="top">My Time Availabilty</Label>

        <input
          type="range"
          min="0"
          max="10"
          step="1"
          name="timeavalable"
          value={TimeAvailable}
          onChange={handleSliderMove}
          className="timeSlider"
        />
        {TimeAvailable}
      </Segment>
    );
  }
};

export default TimeSlider;
