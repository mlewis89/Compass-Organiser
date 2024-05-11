import {
  GridColumn,
  Grid,
  Segment,
} from "semantic-ui-react";
import PlaceholderEvent from "./placeholder/placeholder-event";

const EventList = () => (
  <Grid columns={1} stackable>
    <GridColumn>
      <Segment raised>
        <PlaceholderEvent />
      </Segment>
    </GridColumn>

    <GridColumn>
      <Segment raised>
      <PlaceholderEvent />
      </Segment>
    </GridColumn>

    <GridColumn>
      <Segment raised>
      <PlaceholderEvent />
      </Segment>
    </GridColumn>
  </Grid>
);

export default EventList;
