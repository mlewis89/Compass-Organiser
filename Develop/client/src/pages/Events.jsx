import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react";
import EventList from '../components/EventList'
import DetailedEventItem from '../components/DetailedEventItem'

const Events= () => {

  
  return (
    <Grid >
      <GridRow stretched>
        <GridColumn>
          <Segment padded>
            <Label attached="top">Upcoming Events</Label>
            <EventList  />
          </Segment>
        </GridColumn>
      </GridRow>
      <GridRow stretched>
        <GridColumn >
          <Segment padded>
            <Label attached="top">Event Details</Label>
            <DetailedEventItem id='_ID'/>
          </Segment>
        </GridColumn>
      </GridRow>
    </Grid>
  );
};

export default Events;