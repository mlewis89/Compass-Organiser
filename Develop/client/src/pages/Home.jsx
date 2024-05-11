import { Grid, GridRow, GridColumn, Segment, Label} from "semantic-ui-react";
import BoardPostList from '../components/BoardPostList';
import EventList from '../components/EventList'

const Home = () => {
  return (
 <Grid columns={2}>
    <GridRow stretched>
      <GridColumn>
        <Segment padded>
          <Label attached='top'>Notice Board</Label>
          <BoardPostList />
        </Segment>
      </GridColumn>
      <GridColumn>
        <Segment padded>
          <Label attached='top'>Upcoming Events</Label>
          <EventList />
        </Segment>
      </GridColumn>
      </GridRow>
      </Grid>
);
};

export default Home;
