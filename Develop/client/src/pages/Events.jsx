import { Grid, GridColumn, GridRow } from "semantic-ui-react";
import EventList from '../components/EventList'
import DetailedEventItem from '../components/DetailedEventItem'


const Events= () => {  
  return (
    <Grid >
      <GridRow stretched >
      <GridColumn width={5}>
          <EventList  />
        </GridColumn>
      <GridColumn width={11}>
          <DetailedEventItem />
        </GridColumn>
        
      </GridRow>

    </Grid>
  );
};

export default Events;