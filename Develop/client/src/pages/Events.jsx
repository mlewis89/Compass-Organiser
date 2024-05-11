import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react";
import EventList from '../components/EventList'
import DetailedEventItem from '../components/DetailedEventItem'


const Events= () => {
  const myEvents = [];
  const otherEvents = [];
  const activeEvent = {};
  
  return (
    <Grid columns={2}>
      <GridRow columns={2} stretched>
        <GridColumn>
          <Segment padded>
            <Label attached="top">My Events</Label>
            <EventList  events={myEvents}/>
          </Segment>
        </GridColumn>
        <GridColumn>
          <Segment padded>
            <Label attached="top">Other Events</Label>
            <EventList events={otherEvents} />
          </Segment>
        </GridColumn>
      </GridRow>
      <GridRow stretched columns={1}>
        <GridColumn >
          <Segment padded>
            <Label attached="top">Event Details</Label>
            <DetailedEventItem event={activeEvent} />
          </Segment>
        </GridColumn>
      </GridRow>
    </Grid>
  );
};

export default Events;