import { Grid, GridColumn, GridRow } from "semantic-ui-react";
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
          <DetailedEventItem />
        </GridColumn>
      </GridRow>
    </Grid>
  );
};

export default Events;