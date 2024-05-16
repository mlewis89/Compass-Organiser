import { Grid, GridColumn, GridRow, Segment, Label } from "semantic-ui-react";
import EventList from '../components/EventList'
import DetailedEventItem from '../components/DetailedEventItem'

const Events= () => {

  
  return (
    <Grid >
      <GridRow stretched>
        <GridColumn>
          <EventList  />
        </GridColumn>
      </GridRow>
      <GridRow stretched>
        <GridColumn >
          <DetailedEventItem id='_ID'/>
        </GridColumn>
      </GridRow>
    </Grid>
  );
};

export default Events;