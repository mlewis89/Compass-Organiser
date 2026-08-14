"use client";

import { useMutation, useQuery } from "@apollo/client";
import { Grid, GridColumn, GridRow, Label, Segment } from "semantic-ui-react";
import { QUERY_ME_TIME } from "@/lib/client/queries";
import { UPDATE_ME_TIME } from "@/lib/client/mutations";
import { useCompassContext } from "@/lib/client/CompassContext";
import { UPDATE_TIME_AVAILABLE } from "@/lib/client/actions";

export default function TimeSlider() {
  const [state, dispatch] = useCompassContext();
  const { loading } = useQuery<{ me: { taskAvailabity: number } }>(QUERY_ME_TIME, {
    onCompleted: (result) => {
      dispatch({
        type: UPDATE_TIME_AVAILABLE,
        payload: result.me.taskAvailabity,
      });
    },
  });
  const [saveUserTime] = useMutation(UPDATE_ME_TIME);

  if (loading && state.TimeAvailable === "") {
    return null;
  }

  return (
    <Segment padded>
      <Label attached="top">My Time Availability</Label>
      <Grid columns={2}>
        <GridRow centered>
          <GridColumn>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              name="timeavailable"
              value={state.TimeAvailable === "" ? 0 : state.TimeAvailable}
              onChange={(event) => {
                dispatch({
                  type: UPDATE_TIME_AVAILABLE,
                  payload: event.target.value,
                });
                void saveUserTime({
                  variables: { taskAvailabity: parseInt(event.target.value, 10) },
                });
              }}
              className="timeSlider"
            />
          </GridColumn>
          <GridColumn>
            <Label attached="top" circular size="big">
              {state.TimeAvailable === "" ? 0 : state.TimeAvailable}
            </Label>
          </GridColumn>
        </GridRow>
      </Grid>
    </Segment>
  );
}
