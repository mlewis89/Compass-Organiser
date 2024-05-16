import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react";
import EventList from '../components/EventList'
import DetailedEventItem from '../components/DetailedEventItem'
import { useState } from "react";

const Events= () => {

const [currentEventId, setCurrentEventId] = useState();
  
  return (
    <Grid >
      <GridRow stretched>
        <GridColumn>
          <EventList  setCurrentEventId={setCurrentEventId}/>
        </GridColumn>
      </GridRow>
      <GridRow stretched>
        <GridColumn >
          <DetailedEventItem id={currentEventId}/>
        </GridColumn>
      </GridRow>
    </Grid>
  );
};

export default Events;