import {
  Segment,
  Label,
  Header,
  Grid,
  GridRow,
  GridColumn,
} from "semantic-ui-react";
import { useState } from "react";
import { QUERY_ME_TIME } from "../utils/queries";
import { UPDATE_ME_TIME } from "../utils/mutations";
import { useQuery, useMutation } from "@apollo/client";
import { useCompassContext } from "../utils/CompassContext";
import { UPDATE_TIME_AVAILABLE } from "../utils/actions";

const TimeSlider = () => {
  const [state, dispatch] = useCompassContext();

  const { loading, data } = useQuery(QUERY_ME_TIME, {
    onCompleted: () =>
      dispatch({
        type: UPDATE_TIME_AVAILABLE,
        payload: data.me.taskAvailabity,
      }),
  });

  //const [TimeAvailable, setTimeAvailable] = useState();
  const [saveUserTime, { error }] = useMutation(UPDATE_ME_TIME);

  const handleSliderMove = (event) => {
    event.preventDefault();
    dispatch({ type: UPDATE_TIME_AVAILABLE, payload: event.target.value });
    saveUserTime({
      variables: { taskAvailabity: parseInt(event.target.value) },
    });
  };
  console.log(state.TimeAvailable);
  if (loading && !state.TimeAvailable) {
    return <></>;
  } else {
    return (
      <Segment padded>
        <Label attached="top">My Time Availabilty</Label>
        <Grid columns={2}>
          <GridRow centered>
            <GridColumn>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                name="timeavalable"
                //value={state.TimeAvailable}
                onChange={handleSliderMove}
                className="timeSlider"
              />
            </GridColumn>
            <GridColumn centered>
              <Label attached="top" circular size="big">
                {state.TimeAvailable}
              </Label>
            </GridColumn>
          </GridRow>
        </Grid>
      </Segment>
    );
  }
};

export default TimeSlider;
