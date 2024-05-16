import { Grid, GridRow, GridColumn, Segment, Label} from "semantic-ui-react";
import BoardPostList from '../components/BoardPostList';
import EventList from '../components/EventList'

const Home = () => {
  return (
 <Grid columns={2}>
    <GridRow stretched>
      <GridColumn>
        <BoardPostList />
      </GridColumn>
      <GridColumn>
        <EventList />
      </GridColumn>
      </GridRow>
      </Grid>
);
};

export default Home;
